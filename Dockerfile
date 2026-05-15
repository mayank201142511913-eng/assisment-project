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

# Push schema to DB and start server
CMD npx prisma db push --schema=./server/prisma/schema.prisma --accept-data-loss && npm start
