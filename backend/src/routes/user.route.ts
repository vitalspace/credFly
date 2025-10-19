import { Elysia, t } from "elysia";
import {
  createUser,
  profile,
  updateUser,
} from "../controllers/user.controller";

export const userRoutes = new Elysia({
  detail: {
    tags: ["User"],
  },
})
  .post("/create-user", createUser, {
    body: t.Object({
      address: t.String({
        minLength: 40,
      }),
    }),
  })
  .post("/profile", profile, {
    body: t.Object({
      address: t.String(),
    }),
  })
  .put("/update-user", updateUser, {
    body: t.Object({
      address: t.String(),
      nickname: t.Optional(t.String({ minLength: 6, maxLength: 50 })),
      avatar: t.Optional(t.String({})),
      bio: t.Optional(t.String({ maxLength: 160 })),
    }),
  });
