const { 
  timeToMinutes, 
  calculateDuration, 
  normalizeMacAddress, 
  paginationResponse 
} = require('../../src/utils/helpers');

describe('Helpers Utility Functions', () => {
  
  describe('timeToMinutes', () => {
    it('should convert HH:MM string to total minutes', () => {
      expect(timeToMinutes('01:30')).toBe(90);
      expect(timeToMinutes('00:00')).toBe(0);
      expect(timeToMinutes('23:59')).toBe(1439);
    });
  });

  describe('calculateDuration', () => {
    it('should calculate the difference between two time strings in minutes', () => {
      expect(calculateDuration('08:00', '10:30')).toBe(150);
      expect(calculateDuration('12:00', '12:00')).toBe(0);
    });
  });

  describe('normalizeMacAddress', () => {
    it('should capitalize and replace hyphens with colons', () => {
      expect(normalizeMacAddress('aa-bb-cc-11-22-33')).toBe('AA:BB:CC:11:22:33');
      expect(normalizeMacAddress('aa:bb:cc:11:22:33')).toBe('AA:BB:CC:11:22:33');
    });

    it('should return null if no mac is provided', () => {
      expect(normalizeMacAddress(null)).toBeNull();
      expect(normalizeMacAddress(undefined)).toBeNull();
    });
  });

  describe('paginationResponse', () => {
    it('should return a properly formatted pagination object', () => {
      const data = [1, 2, 3];
      const total = 10;
      const page = 1;
      const limit = 3;
      
      const response = paginationResponse(data, total, page, limit);
      
      expect(response.data).toEqual(data);
      expect(response.pagination.total).toBe(10);
      expect(response.pagination.pages).toBe(4);
      expect(response.pagination.hasNext).toBe(true);
      expect(response.pagination.hasPrev).toBe(false);
    });
  });
});
