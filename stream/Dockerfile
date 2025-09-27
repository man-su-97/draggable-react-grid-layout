# Use your cloned image as base
FROM sayanvdg/mediamtx:latest

# Copy your local config into the container
COPY mediamtx.yml /mediamtx.yml

# Expose the ports
EXPOSE 8554 8888 8889 9997 8189/udp

ENTRYPOINT ["/mediamtx", "/mediamtx.yml"]