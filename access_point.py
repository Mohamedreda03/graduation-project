"""
Access Point Monitor - Smart Attendance System
===============================================
This script monitors devices connected to the hotspot and sends
connection events to the server for automatic attendance recording.

Setup:
1. Change AP_IDENTIFIER below to match your hall in the database
2. Enable Mobile Hotspot on your laptop
3. Run: python access_point.py
"""

import subprocess
import threading
import time
import requests
import sys
from datetime import datetime

# ================== CONFIGURATION ==================
# Change this to your hall's identifier (must exist in database)
AP_IDENTIFIER = "AP_101"

# Network settings
SUBNET = "192.168.137."      # Hotspot IP Range (Windows default)
THREAD_COUNT = 50
MAX_MISSED_PINGS = 3
SCAN_INTERVAL = 2

# Server settings
BACKEND_URL = "http://localhost:5000/api"
AP_API_KEY = "your_access_point_api_key_change_this"
HEARTBEAT_INTERVAL = 60
# ===================================================

print_lock = threading.Lock()

# Track connected devices
# {ip: {"mac": str, "missed": int, "check_in": datetime, "sent_to_server": bool}}
device_tracker = {}

# Server connection status
server_connected = False
current_hall_id = None


def get_mac_from_ip(ip):
    """Extract MAC Address from ARP Table"""
    try:
        output = subprocess.check_output(
            "arp -a",
            shell=True,
            stderr=subprocess.DEVNULL
        ).decode(errors="ignore")
        
        for line in output.splitlines():
            if ip in line:
                parts = line.split()
                for part in parts:
                    # MAC address format: xx-xx-xx-xx-xx-xx or xx:xx:xx:xx:xx:xx
                    if len(part) == 17 and ('-' in part or ':' in part):
                        # Convert to XX:XX:XX:XX:XX:XX format
                        return part.replace('-', ':').upper()
    except:
        pass
    return None


def ping_ip(ip, found_ips):
    """Ping a single IP"""
    args = ["ping", "-n", "1", "-w", "500", ip]
    
    startupinfo = subprocess.STARTUPINFO()
    startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW
    
    try:
        output = subprocess.check_output(
            args,
            startupinfo=startupinfo,
            stderr=subprocess.STDOUT
        ).decode()
        
        if "Reply from" in output and "unreachable" not in output.lower():
            with print_lock:
                found_ips.append(ip)
    except:
        pass


def scan_network():
    """Scan the entire network"""
    found_ips = []
    threads = []
    
    for i in range(2, 255):
        ip = SUBNET + str(i)
        t = threading.Thread(target=ping_ip, args=(ip, found_ips))
        t.start()
        threads.append(t)
        
        if len(threads) >= THREAD_COUNT:
            for th in threads:
                th.join()
            threads = []
    
    for th in threads:
        th.join()
    
    return set(found_ips)


def send_connection_event(event_type, mac_address):
    """Send connection/disconnection event to server"""
    
    global server_connected
    
    if not mac_address:
        return False
    
    try:
        response = requests.post(
            f"{BACKEND_URL}/connections/event",
            json={
                "eventType": event_type,
                "macAddress": mac_address,
                "apIdentifier": AP_IDENTIFIER,
                "timestamp": datetime.now().isoformat()
            },
            headers={
                "Content-Type": "application/json",
                "X-API-Key": AP_API_KEY
            },
            timeout=5
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                return True
        
        print(f"   [!] Server response: {response.status_code}")
        return False
        
    except requests.exceptions.ConnectionError:
        if server_connected:
            print("   [X] Lost connection to server")
            server_connected = False
        return False
    except Exception as e:
        print(f"   [X] Error: {str(e)}")
        return False


def send_heartbeat():
    """Send heartbeat to server to update AP status"""
    global server_connected, current_hall_id
    
    try:
        response = requests.post(
            f"{BACKEND_URL}/connections/event",
            json={
                "eventType": "heartbeat",
                "macAddress": "00:00:00:00:00:00",
                "apIdentifier": AP_IDENTIFIER,
                "timestamp": datetime.now().isoformat()
            },
            headers={
                "Content-Type": "application/json",
                "X-API-Key": AP_API_KEY
            },
            timeout=5
        )
        
        if response.status_code in [200, 401, 404]:
            if not server_connected:
                print("[OK] Connected to server successfully")
                server_connected = True
            return True
        return False
        
    except requests.exceptions.ConnectionError:
        if server_connected:
            print("[X] Lost connection to server - will retry...")
            server_connected = False
        return False
    except:
        return False


def heartbeat_loop():
    """Background heartbeat loop"""
    while True:
        send_heartbeat()
        time.sleep(HEARTBEAT_INTERVAL)


def main():
    """Main program"""
    global server_connected
    
    print("\n" + "=" * 50)
    print("Access Point Monitor")
    print("=" * 50)
    print(f"Hall: {AP_IDENTIFIER}")
    print(f"Network: {SUBNET}x")
    print(f"Server: {BACKEND_URL}")
    print("=" * 50)
    
    # Check server connection
    print("\n[...] Connecting to server...")
    if send_heartbeat():
        print("[OK] Connected to server!")
    else:
        print("[!] Cannot connect to server - running offline")
    
    # Start heartbeat loop in background
    heartbeat_thread = threading.Thread(target=heartbeat_loop, daemon=True)
    heartbeat_thread.start()
    
    print("\nScanning... (Ctrl+C to stop)\n")
    
    try:
        while True:
            current_devices = scan_network()
            now = datetime.now()
            
            # -------- New or still connected devices --------
            for ip in current_devices:
                if ip not in device_tracker:
                    mac = get_mac_from_ip(ip)
                    
                    device_tracker[ip] = {
                        "mac": mac,
                        "missed": 0,
                        "check_in": now,
                        "sent_to_server": False
                    }
                    
                    time_str = now.strftime('%H:%M:%S')
                    print(f"[+] JOINED | IP: {ip} | MAC: {mac or 'Unknown'} | Time: {time_str}")
                    
                    # Send connection event to server
                    if mac:
                        if send_connection_event("device-connected", mac):
                            device_tracker[ip]["sent_to_server"] = True
                            print(f"    [OK] Event sent to server")
                        else:
                            print(f"    [!] Failed to send event (will retry)")
                else:
                    device_tracker[ip]["missed"] = 0
                    
                    # Retry sending event if failed before
                    if not device_tracker[ip]["sent_to_server"] and device_tracker[ip]["mac"]:
                        if send_connection_event("device-connected", device_tracker[ip]["mac"]):
                            device_tracker[ip]["sent_to_server"] = True
                            print(f"    [OK] Pending event sent to server ({ip})")
            
            # -------- Devices that left --------
            for ip in list(device_tracker.keys()):
                if ip not in current_devices:
                    device_tracker[ip]["missed"] += 1
                    
                    if device_tracker[ip]["missed"] >= MAX_MISSED_PINGS:
                        device = device_tracker[ip]
                        check_in = device["check_in"]
                        duration = (now - check_in).total_seconds()
                        mac = device["mac"]
                        
                        time_str = now.strftime('%H:%M:%S')
                        duration_str = f"{int(duration // 60)} min" if duration >= 60 else f"{int(duration)} sec"
                        
                        print(f"[-] LEFT   | IP: {ip} | MAC: {mac or 'Unknown'} | Duration: {duration_str} | Time: {time_str}")
                        
                        # Send disconnection event to server
                        if mac:
                            if send_connection_event("device-disconnected", mac):
                                print(f"    [OK] Disconnect event sent to server")
                            else:
                                print(f"    [!] Failed to send disconnect event")
                        
                        del device_tracker[ip]
            
            time.sleep(SCAN_INTERVAL)
            
    except KeyboardInterrupt:
        print("\n\n" + "=" * 60)
        print("Monitoring stopped")
        print("=" * 60)
        
        # Show summary
        if device_tracker:
            print(f"\nDevices connected at shutdown: {len(device_tracker)}")
            for ip, info in device_tracker.items():
                print(f"   - {ip} ({info['mac'] or 'Unknown MAC'})")


if __name__ == "__main__":
    main()
