import Bowser from "bowser";
import { db } from "../../../db/index";
import { loginLogs } from "../../../db/schema";
import { allLoginProvidersEnum } from "../constants";

type CreateLoginLogParams = {
  userAgent: string | null;
  userId: string;
  sessionId: string;
  ip: string;
  strategy: (typeof allLoginProvidersEnum)[number];
};

export const createLoginLog = async ({
  userAgent,
  userId,
  sessionId,
  ip,
  strategy,
}: CreateLoginLogParams) => {
  if (!userAgent) {
    throw new Error("Internal Error");
  }
  const parser = Bowser.getParser(userAgent);

  try {
    await db.insert(loginLogs).values({
      userId,
      sessionId,
      ip,
      strategy,
      os: `${parser.getOSName()} ${parser.getOSVersion()}`,
      browser: `${parser.getBrowserName()} ${parser.getBrowserVersion()}`,
      device: parser.getPlatformType(),
    });
  } catch (error) {
    console.error("Error while inserting logs", error);
    throw new Error("Failed to create logs");
  }
};
