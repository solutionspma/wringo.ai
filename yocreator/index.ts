// YO Creator Engine – Entry Point

import { checkEntitlement, deductUsage } from '../server/services/entitlements.js';

export async function yoCreatorEngine(input: {
  rawInput: string;
  source?: "voice" | "text";
  context?: Record<string, any>;
  userId: string;
  action: string; // avatar_creation, scene_generation, etc.
}) {
  // 1. Check entitlements BEFORE execution
  const entitlement = await checkEntitlement(input.userId, input.action);
  
  if (!entitlement.allowed) {
    return {
      error: "insufficient_entitlements",
      message: "You need to purchase credits or subscribe to use this feature",
      requiresPurchase: true,
    };
  }

  // 2. Execute the creative action
  try {
    // TODO: Actual scene generation logic goes here
    const result = {
      normalizedIntent: input.rawInput,
      inferredScene: "auto",
      clarifyingQuestions: [],
      output: {
        sections: [],
        nextAction: "refine"
      }
    };

    // 3. Deduct usage atomically AFTER successful execution
    await deductUsage(input.userId, input.action, 1);

    return {
      ...result,
      entitlementSource: entitlement.source,
    };
  } catch (err) {
    // Don't deduct if execution failed
    throw err;
  }
}

