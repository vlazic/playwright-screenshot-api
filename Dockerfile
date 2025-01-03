FROM mcr.microsoft.com/playwright:v1.49.1-noble

WORKDIR /app

# Create cache directory with proper permissions
RUN mkdir -p /app/cache && chown -R pwuser:pwuser /app/cache

COPY package*.json ./
COPY server.js ./

RUN npm install

EXPOSE 3000

# Ensure cache directory persists and has correct permissions
VOLUME ["/app/cache"]

CMD ["node", "server.js"]
