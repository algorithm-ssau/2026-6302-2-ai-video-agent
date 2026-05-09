FROM node:20-bookworm-slim

WORKDIR /app

# Limit FFmpeg threads to avoid OOM on small hosts
ENV FFMPEG_THREADS=1
ENV FFMPEG_LOOKAHEAD_THREADS=1

COPY package*.json ./

# Remotion renderer needs system libs for headless Chrome.
RUN apt-get update && apt-get install -y --no-install-recommends \
	ca-certificates \
	dumb-init \
	fontconfig \
	fonts-liberation \
	libasound2 \
	libatk-bridge2.0-0 \
	libatk1.0-0 \
	libc6 \
	libcairo2 \
	libcups2 \
	libdbus-1-3 \
	libdrm2 \
	libexpat1 \
	libgbm1 \
	libglib2.0-0 \
	libgtk-3-0 \
	libnspr4 \
	libnss3 \
	libpango-1.0-0 \
	libpangocairo-1.0-0 \
	libx11-6 \
	libx11-xcb1 \
	libxcb1 \
	libxcomposite1 \
	libxcursor1 \
	libxdamage1 \
	libxext6 \
	libxfixes3 \
	libxi6 \
	libxrandr2 \
	libxrender1 \
	libxshmfence1 \
	libxss1 \
	libxtst6 \
	xdg-utils \
	&& rm -rf /var/lib/apt/lists/*

RUN npm install && npm exec -- remotion browser ensure

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["dumb-init", "npm", "start", "--", "--hostname", "0.0.0.0", "--port", "3000"]
