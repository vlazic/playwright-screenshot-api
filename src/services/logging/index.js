import { format } from "date-fns";

/**
 * Creates a logging middleware that logs requests in Apache-like format
 * @returns {import('express').RequestHandler}
 */
export const createLoggingMiddleware = () => {
  return (req, res, next) => {
    // Record start time
    const startTime = Date.now();

    // Store original end function
    const originalEnd = res.end;

    // Override end function to log after response is sent
    res.end = function (...args) {
      const responseTime = Date.now() - startTime;
      const timestamp = format(new Date(), "dd/MMM/yyyy:HH:mm:ss xx");

      // Get request body for POST requests
      const body = req.method === "POST" ? JSON.stringify(req.body) : "";

      // Apache-like log format:
      // ip - - [timestamp] "method url body" status responseTime
      console.log(
        `${req.ip} - - [${timestamp}] "${req.method} ${req.originalUrl}${
          body ? ` ${body}` : ""
        }" ${res.statusCode} ${responseTime}ms`
      );

      originalEnd.apply(res, args);
    };

    next();
  };
};
