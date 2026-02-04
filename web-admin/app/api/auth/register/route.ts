import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, generateToken } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/response'
import { RegisterRequest } from '@/types'
import { nanoid } from 'nanoid'

// 获取或创建默认教师（用于班级关联）
async function getOrCreateDefaultTeacher(): Promise<string> {
 // 先找现有教师
 const existingTeacher = await prisma.teachers.findFirst({
 where: { user: { is_active: true } }
 })
 if (existingTeacher) {
 return existingTeacher.id
 }

 // 找管理员用户，为其创建教师身份
 const adminUser = await prisma.user.findFirst({
 where: { role: 'ADMIN', is_active: true },
 include: { teachers: true }
 })

 if (adminUser?.teachers) {
 return adminUser.teachers.id
 }

 if (adminUser) {
 const newTeacher = await prisma.teachers.create({
 data: {
 id: nanoid(),
 user_id: adminUser.id,
 school: '管理员',
 subject: '英语',
 updated_at: new Date(),
 }
 })
 return newTeacher.id
 }

 throw new Error('系统未初始化，请先创建管理员账号')
}

export async function POST(request: NextRequest) {
 try {
 const body: RegisterRequest = await request.json()
 const { email, phone, password, name, role } = body

 // 验证必填字段
 if (!password || !name || !role) {
 return errorResponse('缺少必填字段')
 }

 if (!email && !phone) {
 return errorResponse('邮箱或手机号至少填写一个')
 }

 // 检查用户是否已存在
 const existingUser = await prisma.user.findFirst({
 where: {
 OR: [
 email ? { email } : {},
 phone ? { phone } : {},
 ],
 },
 })

 if (existingUser) {
 return errorResponse('用户已存在')
 }

 // 加密密码
 const hashedPassword = await hashPassword(password)

 // 处理空值：空字符串转为null，避免唯一约束冲突
 const emailValue = email || null
 const phoneValue = phone || null

 // 创建用户
 const user = await prisma.user.create({
 data: {
 email: emailValue,
 phone: phoneValue,
 password: hashedPassword,
 name,
 role,
 updated_at: new Date(),
 },
 })

 // 根据角色创建对应的扩展信息
 if (role === 'TEACHER') {
 await prisma.teachers.create({
 data: {
 id: nanoid(),
 user_id: user.id,
 updated_at: new Date(),
 },
 })
 } else if (role === 'ADMIN') {
 // 管理员自动创建教师身份
 await prisma.teachers.create({
 data: {
 id: nanoid(),
 user_id: user.id,
 school: '管理员',
 subject: '英语',
 updated_at: new Date(),
 },
 })
 } else if (role === 'STUDENT') {
 // 学生需要学号和班级，先分配到默认班级
 let defaultClass = await prisma.classes.findFirst({
 where: { name: '未分配班级' },
 })

 if (!defaultClass) {
 const teacherId = await getOrCreateDefaultTeacher()
 defaultClass = await prisma.classes.create({
 data: {
 id: nanoid(),
 name: '未分配班级',
 teacher_id: teacherId,
 updated_at: new Date(),
 },
 })
 }

 await prisma.students.create({
 data: {
 id: nanoid(),
 user_id: user.id,
 student_no: `STU${Date.now()}`,
 class_id: defaultClass.id,
 updated_at: new Date(),
 },
 })
 }

 // 生成token
 const token = generateToken({
 userId: user.id,
 email: user.email || undefined,
 role: user.role,
 })

 return successResponse({
 user: {
 id: user.id,
 name: user.name,
 email: user.email,
 phone: user.phone,
 role: user.role,
 },
 token,
 }, '注册成功')
 } catch (error) {
 console.error('注册错误:', error)
 return errorResponse('注册失败', 500)
 }
}
