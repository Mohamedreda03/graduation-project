import os
import sys
import subprocess
import re
import shutil

# 1. Automatically install dependencies if not present
try:
    import requests
    import markdown
except ImportError:
    print("Installing required python packages (requests, markdown)...")
    subprocess.run([sys.executable, "-m", "pip", "install", "requests", "markdown"])
    import requests
    import markdown

# 2. Helper to find MS Edge or Chrome
def find_browser():
    paths = [
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    ]
    for p in paths:
        if os.path.exists(p):
            return p
    for b in ['msedge', 'chrome', 'microsoft-edge', 'google-chrome']:
        path = shutil.which(b)
        if path:
            return path
    return None

# 3. Kroki API renderer for Mermaid
def render_mermaid_to_svg(mermaid_code):
    try:
        # Kroki mermaid endpoint
        response = requests.post("https://kroki.io/mermaid/svg", data=mermaid_code, timeout=15)
        if response.status_code == 200:
            return response.text
    except Exception as e:
        print(f"  Warning: Failed to render mermaid via Kroki ({e}). Skipping diagram.")
    return None

def process_markdown_file(md_path, html_path):
    with open(md_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Pre-process Mermaid diagrams
    # We find blocks of ```mermaid ... ```
    pattern = re.compile(r"```mermaid\s*\n(.*?)\n```", re.DOTALL)
    
    def replace_mermaid(match):
        mermaid_code = match.group(1).strip()
        print(f"  Rendering Mermaid diagram...")
        svg_content = render_mermaid_to_svg(mermaid_code)
        if svg_content:
            # Strip XML declaration from SVG if present
            svg_content = re.sub(r'<\?xml.*?\?>', '', svg_content)
            return f'<div class="mermaid-diagram">{svg_content}</div>'
        else:
            # Fallback to pre block
            return f'<pre class="mermaid-fallback">{mermaid_code}</pre>'

    content_with_svg = pattern.sub(replace_mermaid, content)

    # Convert Markdown to HTML
    html_body = markdown.markdown(content_with_svg, extensions=['tables', 'fenced_code', 'nl2br'])

    # Beautiful premium HTML Template with styling for print/PDF
    html_content = f"""<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>Document</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
        
        body {{
            font-family: 'Cairo', system-ui, -apple-system, sans-serif;
            direction: rtl;
            line-height: 1.6;
            color: #2d3748;
            padding: 30px;
            max-width: 850px;
            margin: 0 auto;
            font-size: 14px;
        }}
        
        h1, h2, h3, h4, h5, h6 {{
            color: #1a202c;
            font-family: 'Cairo', sans-serif;
            font-weight: 700;
            margin-top: 1.2em;
            margin-bottom: 0.4em;
            page-break-after: avoid;
        }}
        
        h1 {{
            font-size: 2em;
            border-bottom: 3px solid #3b82f6;
            padding-bottom: 0.4em;
            text-align: center;
            color: #1e3a8a;
            margin-bottom: 1em;
        }}
        
        h2 {{
            font-size: 1.4em;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 0.2em;
            color: #2b6cb0;
        }}
        
        h3 {{
            font-size: 1.15em;
            color: #4a5568;
        }}

        p {{
            margin-bottom: 1em;
            text-align: justify;
        }}

        /* pre tags style for ASCII box diagrams and code */
        pre {{
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 12px;
            font-family: 'Consolas', 'Courier New', monospace;
            font-size: 11px;
            line-height: 1.25;
            overflow-x: auto;
            white-space: pre;
            direction: ltr;
            text-align: left;
            margin: 15px 0;
            page-break-inside: auto; /* Allow break if necessary to prevent large gaps */
        }}

        code {{
            font-family: 'Consolas', 'Courier New', monospace;
            background-color: #edf2f7;
            padding: 2px 5px;
            border-radius: 4px;
            font-size: 0.85em;
            color: #e53e3e;
        }}

        pre code {{
            background-color: transparent;
            padding: 0;
            border-radius: 0;
            font-size: 1em;
            color: inherit;
        }}

        /* Table styling */
        table {{
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 0.9em;
            border-radius: 6px;
            overflow: hidden;
            page-break-inside: auto;
        }}

        th, td {{
            padding: 10px 12px;
            border: 1px solid #e2e8f0;
            text-align: right;
        }}

        th {{
            background-color: #ebf8ff;
            color: #2b6cb0;
            font-weight: 700;
        }}

        tr:nth-of-type(even) {{
            background-color: #f7fafc;
        }}

        blockquote {{
            margin: 15px 0;
            padding: 8px 15px;
            border-right: 4px solid #3b82f6;
            background-color: #eff6ff;
            color: #1e3a8a;
            border-radius: 4px;
        }}

        /* Mermaid diagram styling - smaller and centered */
        .mermaid-diagram {{
            text-align: center;
            margin: 20px 0;
            page-break-inside: auto; /* Prevent forcing new page start */
        }}

        .mermaid-diagram svg {{
            width: 100% !important;
            max-width: 550px !important;
            height: auto !important;
            filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.04));
        }}

        hr {{
            border: 0;
            height: 1px;
            background: #e2e8f0;
            margin: 30px 0;
        }}

        /* Page numbering and print styling */
        @media print {{
            body {{
                padding: 0;
                margin: 0;
            }}
            @page {{
                size: A4;
                margin: 20mm;
            }}
        }}
    </style>
</head>
<body>
    {html_body}
</body>
</html>
"""
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html_content)

def main():
    browser_path = find_browser()
    if not browser_path:
        print("Error: Could not find Microsoft Edge or Google Chrome. Please install one of them.")
        sys.exit(1)
        
    print(f"Using browser for PDF conversion: {browser_path}")

    # Paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    input_dir = os.path.join(script_dir, "project_guide")
    output_dir = os.path.join(script_dir, "project_guide_pdf")
    temp_dir = os.path.join(script_dir, "temp_html")

    if not os.path.exists(input_dir):
        print(f"Error: Directory '{input_dir}' not found.")
        sys.exit(1)

    os.makedirs(output_dir, exist_ok=True)
    os.makedirs(temp_dir, exist_ok=True)

    files = [f for f in os.listdir(input_dir) if f.endswith(".md")]
    files.sort()

    print(f"Found {len(files)} markdown files to convert.")

    for file_name in files:
        md_path = os.path.join(input_dir, file_name)
        base_name = os.path.splitext(file_name)[0]
        html_path = os.path.join(temp_dir, f"{base_name}.html")
        pdf_path = os.path.join(output_dir, f"{base_name}.pdf")

        print(f"\nProcessing '{file_name}'...")
        
        # 1. Convert MD to HTML (including Mermaid fetching)
        process_markdown_file(md_path, html_path)
        
        # 2. Render HTML to PDF using Chrome/Edge command line print-to-pdf
        print(f"  Generating PDF '{base_name}.pdf'...")
        cmd = [
            browser_path,
            "--headless",
            "--disable-gpu",
            "--no-sandbox",
            f"--print-to-pdf={pdf_path}",
            html_path
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode == 0:
            print(f"  Successfully saved to: {pdf_path}")
        else:
            print(f"  Error printing PDF: {result.stderr}")

    # Cleanup temp HTML files
    print("\nCleaning up temporary HTML files...")
    shutil.rmtree(temp_dir)
    print("Done! All PDFs are generated in 'explan/project_guide_pdf' folder.")

if __name__ == "__main__":
    main()
