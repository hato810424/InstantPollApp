import { Variables } from "./server";

declare global {
  namespace Vike {
    interface PageContext extends Variables {};
  }
}

export {};
