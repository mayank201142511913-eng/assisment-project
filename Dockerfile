FROM node:18-alpine

# Add openssl for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Copy root package.json
COPY package*.json ./

# Install root dependencies
RUN npm install

# Copy all files
COPY . .

# Run the build script
RUN npm run build

EXPOSE 5000

# Start server
CMD npm start
