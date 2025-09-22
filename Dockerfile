# Stage 1: Build the React application
FROM node:18-alpine as build-stage
WORKDIR /app
COPY package.json package-lock.json ./
# Install only the production dependencies
RUN npm install
COPY . .
# Now run the build command
RUN npm run build

# Stage 2: Serve the compiled application with Nginx
FROM nginx:1.26.2-alpine
# Copy the compiled files from the 'build' stage into Nginx's web root
COPY --from=build-stage /app/build /usr/share/nginx/html
# Expose the standard HTTP port
EXPOSE 80
# The command to start Nginx
CMD ["nginx", "-g", "daemon off;"]