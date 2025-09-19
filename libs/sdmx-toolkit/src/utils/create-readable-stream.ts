export const createReadableStream = (
  stream: ReadableStream<Uint8Array>,
): ReadableStream => {
  const bom = new TextEncoder().encode('\uFEFF');
  return new ReadableStream({
    start(controller) {
      controller.enqueue(bom);
      const reader = stream.getReader();

      function push() {
        reader
          .read()
          .then(({ done, value }) => {
            if (done) {
              controller.close();
              return;
            }
            controller.enqueue(value);
            return push();
          })
          .catch((err) => {
            controller.error(err);
          });
      }

      push();
    },
  });
};
