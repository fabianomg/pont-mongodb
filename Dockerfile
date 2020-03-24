
FROM node:alpine

# Create app directory
WORKDIR /usr/src/cards

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
ENV PORT=3332
COPY . .

EXPOSE $PORT
CMD [ "npm", "start"]