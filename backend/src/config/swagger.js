const swaggerJsdoc = require("swagger-jsdoc");

const baseOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Smart Attendance System API",
      version: "1.0.0",
      description: "WiFi-based Smart Attendance System for University - API Documentation",
      contact: {
        name: "Development Team",
        email: "support@smartattendance.edu",
      },
    },
    servers: [
      {
        url: "http://localhost:5000/api",
        description: "Development Server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JWT token",
        },
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "accessToken",
          description: "Cookie-based authentication for web",
        },
        apiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "x-api-key",
          description: "API Key for Access Point authentication",
        },
      },
      schemas: {
        // User Schema
        User: {
          type: "object",
          properties: {
            _id: { type: "string", example: "507f1f77bcf86cd799439011" },
            name: { type: "string", example: "أحمد محمد" },
            email: { type: "string", format: "email", example: "ahmed@university.edu" },
            role: { type: "string", enum: ["student", "doctor", "admin"], example: "student" },
            studentId: { type: "string", example: "20210001" },
            specialization: { type: "string", example: "507f1f77bcf86cd799439011" },
            level: { type: "integer", minimum: 1, maximum: 6, example: 3 },
            phone: { type: "string", example: "01012345678" },
            isActive: { type: "boolean", example: true },
            createdAt: { type: "string", format: "date-time", example: "2026-01-15T10:30:00Z" },
          },
        },

        // Specialization Schema
        Specialization: {
          type: "object",
          properties: {
            _id: { type: "string", example: "507f1f77bcf86cd799439011" },
            name: { type: "string", example: "علوم الحاسب" },
            code: { type: "string", example: "CS" },
            faculty: { type: "string", example: "كلية الحاسبات والمعلومات" },
            description: { type: "string" },
            isActive: { type: "boolean", example: true },
          },
        },

        // Course Schema
        Course: {
          type: "object",
          properties: {
            _id: { type: "string", example: "507f1f77bcf86cd799439011" },
            name: { type: "string", example: "هياكل البيانات" },
            code: { type: "string", example: "CS201" },
            specialization: { type: "string" },
            doctor: { type: "string" },
            creditHours: { type: "integer", example: 3 },
            level: { type: "integer", example: 2 },
            semester: { type: "integer", enum: [1, 2], example: 1 },
            students: { type: "array", items: { type: "string" } },
            isActive: { type: "boolean", example: true },
          },
        },

        // Hall Schema
        Hall: {
          type: "object",
          properties: {
            _id: { type: "string", example: "507f1f77bcf86cd799439011" },
            name: { type: "string", example: "قاعة 101" },
            building: { type: "string", example: "مبنى الحاسبات" },
            floor: { type: "integer", example: 1 },
            capacity: { type: "integer", example: 100 },
            hallType: { type: "string", enum: ["lecture_hall", "lab", "classroom"] },
            accessPoint: {
              type: "object",
              properties: {
                macAddress: { type: "string", example: "AA:BB:CC:DD:EE:FF" },
                ssid: { type: "string", example: "HALL_101_AP" },
                ipAddress: { type: "string", example: "192.168.1.100" },
                isActive: { type: "boolean", example: true },
              },
            },
            isActive: { type: "boolean", example: true },
          },
        },

        // Lecture Schema
        Lecture: {
          type: "object",
          properties: {
            _id: { type: "string", example: "507f1f77bcf86cd799439011" },
            course: { type: "string" },
            hall: { type: "string" },
            dayOfWeek: { type: "integer", minimum: 0, maximum: 6, description: "0=Sunday, 6=Saturday" },
            startTime: { type: "string", example: "09:00" },
            endTime: { type: "string", example: "10:30" },
            lectureType: { type: "string", enum: ["lecture", "section", "lab"] },
            weekPattern: { type: "string", enum: ["weekly", "odd", "even"] },
            isActive: { type: "boolean", example: true },
          },
        },

        // Attendance Record Schema
        AttendanceRecord: {
          type: "object",
          properties: {
            _id: { type: "string" },
            student: { type: "string" },
            course: { type: "string" },
            lecture: { type: "string" },
            hall: { type: "string" },
            date: { type: "string", format: "date" },
            status: { type: "string", enum: ["in-progress", "present", "absent"] },
            sessions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  checkIn: { type: "string", format: "date-time" },
                  checkOut: { type: "string", format: "date-time" },
                  duration: { type: "integer", description: "Duration in minutes" },
                },
              },
            },
            totalPresenceTime: { type: "integer", description: "Total time in minutes" },
            presencePercentage: { type: "number", example: 85.5 },
            isFinalized: { type: "boolean" },
          },
        },

        // Connection Log Schema
        ConnectionLog: {
          type: "object",
          properties: {
            _id: { type: "string" },
            macAddress: { type: "string", example: "11:22:33:44:55:66" },
            accessPoint: {
              type: "object",
              properties: {
                macAddress: { type: "string" },
                hall: { type: "string" },
              },
            },
            eventType: { type: "string", enum: ["device-connected", "device-disconnected"] },
            timestamp: { type: "string", format: "date-time" },
            processed: { type: "boolean" },
          },
        },

        // Setting Schema
        Setting: {
          type: "object",
          properties: {
            key: { type: "string", example: "MIN_PRESENCE_PERCENTAGE" },
            value: { type: "number", example: 85 },
            description: { type: "string" },
          },
        },

        // Error Response
        Error: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string", example: "Error message" },
            statusCode: { type: "integer", example: 400 },
          },
        },

        // Success Response
        SuccessResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string" },
            data: { type: "object" },
          },
        },

        // Pagination Response
        PaginationResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: { type: "array", items: { type: "object" } },
            pagination: {
              type: "object",
              properties: {
                page: { type: "integer", example: 1 },
                limit: { type: "integer", example: 20 },
                total: { type: "integer", example: 100 },
                pages: { type: "integer", example: 5 },
              },
            },
          },
        },

        // Login Request
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email", example: "admin@smartattendance.edu" },
            password: { type: "string", example: "admin123456" },
          },
        },

        // Login Response
        LoginResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: "Login successful" },
            data: {
              type: "object",
              properties: {
                user: { $ref: "#/components/schemas/User" },
                accessToken: { type: "string" },
                refreshToken: { type: "string" },
              },
            },
          },
        },

        // Connection Event Request
        ConnectionEventRequest: {
          type: "object",
          required: ["eventType", "macAddress", "apMacAddress"],
          properties: {
            eventType: {
              type: "string",
              enum: ["device-connected", "device-disconnected"],
              example: "device-connected",
            },
            macAddress: {
              type: "string",
              example: "11:22:33:44:55:66",
              description: "Student device MAC address",
            },
            apMacAddress: {
              type: "string",
              example: "AA:BB:CC:DD:EE:FF",
              description: "Access Point MAC address",
            },
            timestamp: {
              type: "string",
              format: "date-time",
              description: "Event timestamp (optional, defaults to now)",
            },
          },
        },

        // Device Binding Request
        DeviceBindingRequest: {
          type: "object",
          required: ["deviceId", "macAddress"],
          properties: {
            deviceId: { type: "string", example: "device-unique-id-123" },
            macAddress: { type: "string", example: "11:22:33:44:55:66" },
            deviceModel: { type: "string", example: "Samsung Galaxy S21" },
            osVersion: { type: "string", example: "Android 12" },
          },
        },
      },
    },
    tags: [
      { name: "Auth", description: "Authentication endpoints" },
      { name: "Auth - Web", description: "Web authentication (Admin & Doctor)" },
      { name: "Auth - Mobile", description: "Mobile authentication (Student)" },
      { name: "Users", description: "User management (Admin only)" },
      { name: "Profile", description: "Current logged-in user profile" },
      { name: "Students", description: "Student management" },
      { name: "Doctors", description: "Doctor management" },
      { name: "Specializations", description: "Specialization management" },
      { name: "Courses", description: "Course management" },
      { name: "Halls", description: "Hall & Access Point management" },
      { name: "Lectures", description: "Lecture schedule management" },
      { name: "Attendance", description: "Attendance records" },
      { name: "Connections", description: "WiFi connection events from Access Points" },
      { name: "Settings", description: "System settings (Admin only)" },
      { name: "Dashboard", description: "Dashboard statistics and overviews" },
      { name: "AI", description: "AI Assistant endpoints" },
    ],
  },
  apis: ["./src/routes/*.js"],
};

// Generate full spec from all routes
const fullSpec = swaggerJsdoc(baseOptions);

/**
 * Filter Swagger Specification by tags
 * @param {Array<string>} allowedTags 
 * @param {string} title 
 * @returns {object}
 */
const filterSpec = (allowedTags, title) => {
  const spec = JSON.parse(JSON.stringify(fullSpec));
  spec.info.title = title;

  // Filter global tags list
  if (spec.tags) {
    spec.tags = spec.tags.filter((t) => allowedTags.includes(t.name));
  }

  // Filter paths
  Object.keys(spec.paths).forEach((path) => {
    Object.keys(spec.paths[path]).forEach((method) => {
      const operation = spec.paths[path][method];
      if (operation.tags) {
        const hasTag = operation.tags.some((tag) => allowedTags.includes(tag));
        if (!hasTag) {
          delete spec.paths[path][method];
        }
      } else {
        // If an operation has no tags, we either keep it or remove it. We'll remove it.
        delete spec.paths[path][method];
      }
    });

    if (Object.keys(spec.paths[path]).length === 0) {
      delete spec.paths[path];
    }
  });

  return spec;
};

const adminTags = [
  "Auth - Web",
  "Auth",
  "Users",
  "Profile",
  "Students",
  "Doctors",
  "Specializations",
  "Courses",
  "Halls",
  "Lectures",
  "Attendance",
  "Connections",
  "Settings",
  "Dashboard",
  "AI"
];

const mobileTags = [
  "Auth - Mobile",
  "Auth",
  "Profile",
  "Students",
  "Courses",
  "Lectures",
  "Attendance",
  "AI"
];

const doctorTags = [
  "Auth - Web",
  "Auth",
  "Profile",
  "Doctors",
  "Courses",
  "Lectures",
  "Attendance",
  "Dashboard",
  "AI"
];

const adminSpec = filterSpec(adminTags, "Smart Attendance - Admin API");
const mobileSpec = filterSpec(mobileTags, "Smart Attendance - Mobile API");
const doctorSpec = filterSpec(doctorTags, "Smart Attendance - Doctor API");

module.exports = {
  adminSpec,
  mobileSpec,
  doctorSpec,
  fullSpec,
};
