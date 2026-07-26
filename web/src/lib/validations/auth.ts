import { z } from "zod"

export const registerSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(1, "请填写昵称")
      .max(40, "昵称过长"),
    email: z.email("邮箱格式不正确").transform((v) => v.trim().toLowerCase()),
    password: z.string().min(8, "密码至少 8 位").max(128, "密码过长"),
    confirm: z.string().min(8, "请确认密码"),
  })
  .refine((data) => data.password === data.confirm, {
    message: "两次密码不一致",
    path: ["confirm"],
  })

export const loginSchema = z.object({
  email: z.email("邮箱格式不正确").transform((v) => v.trim().toLowerCase()),
  password: z.string().min(1, "请输入密码"),
  remember: z.boolean().optional().default(true),
})

export const createApiKeySchema = z.object({
  name: z
    .string()
    .trim()
    .max(40, "名称过长")
    .optional()
    .transform((v) => (v && v.length > 0 ? v : "default")),
})

export const revokeApiKeySchema = z.object({
  id: z.string().uuid("无效的 Key id"),
})
