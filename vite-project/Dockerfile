FROM node:20 AS build
WORKDIR /app

ARG VITE_USER_API_URL
ARG VITE_PRODUCT_API_URL
ARG VITE_CART_API_URL

ENV VITE_USER_API_URL=$VITE_USER_API_URL
ENV VITE_PRODUCT_API_URL=$VITE_PRODUCT_API_URL
ENV VITE_CART_API_URL=$VITE_CART_API_URL

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:20-slim
WORKDIR /app

RUN npm install -g serve

COPY --from=build /app/dist ./dist

EXPOSE 5173

CMD ["serve", "-s", "dist", "-l", "5173"]
