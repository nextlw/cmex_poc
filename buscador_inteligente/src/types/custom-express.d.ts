import { FastApiNCMResult } from "./ncm";

declare global {
  namespace Express {
    interface Request {
      fastApiResult?: FastApiNCMResult | null;
    }
  }
}
