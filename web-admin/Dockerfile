FROM m.daocloud.io/docker.io/library/node:20-alpine

WORKDIR /app

# 安装OpenSSL（Prisma需要）
RUN apk add --no-cache openssl

# 复制package文件
COPY package*.json ./
COPY prisma ./prisma/

# 安装所有依赖（包括devDependencies，构建需要）
RUN npm ci

# 设置Prisma引擎平台为linux-musl（Alpine）
ENV PRISMA_CLI_BINARY_TARGETS=linux-musl

# 生成Prisma Client
RUN npx prisma generate

# 复制所有源代码
COPY . .

# 构建应用
RUN npm run build

# 清理devDependencies
RUN npm prune --production

EXPOSE 3000

CMD ["npm", "start"]
