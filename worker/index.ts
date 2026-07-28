import handler from "vinext/server/app-router-entry";

const worker = {
  fetch(request: Request): Promise<Response> {
    return handler.fetch(request);
  },
};

export default worker;
