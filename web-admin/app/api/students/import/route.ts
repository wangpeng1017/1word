import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader, hashPassword } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/response'
import { StudentImportRow } from '@/types'
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

// 批量导入学生
export async function POST(request: NextRequest) {
 try {
 const authHeader = request.headers.get('authorization')
 const token = getTokenFromHeader(authHeader || '')

 const payload = verifyToken(token || '')
 if (!payload || (payload.role !== 'TEACHER' && payload.role !== 'ADMIN')) {
 return unauthorizedResponse('只有教师或管理员可以导入学生')
 }

 const body = await request.json()
 const { students, defaultPassword } = body as {
 students: StudentImportRow[]
 defaultPassword?: string
 }

 if (!students || students.length === 0) {
 return errorResponse('学生数据不能为空')
 }

 const password = defaultPassword || '123456'
 const hashedPassword = await hashPassword(password)

 const results = {
 success: 0,
 failed: 0,
 errors: [] as string[],
 }

 for (const studentData of students) {
 try {
 const { name, studentNo, className } = studentData

 if (!name || !studentNo) {
 results.failed++
 results.errors.push(`学号 ${studentNo || '未知'}: 姓名或学号为空`)
 continue
 }

 // 检查学号是否已存在
 const existing = await prisma.students.findUnique({
 where: { student_no: studentNo },
 })

 if (existing) {
 results.failed++
 results.errors.push(`学号 ${studentNo}: 已存在`)
 continue
 }

 // 查找班级，如果没有则使用默认班级
 let classId: string

 if (className) {
 const classData = await prisma.classes.findFirst({
 where: { name: className },
 })
 if (classData) {
 classId = classData.id
 } else {
 // 班级不存在，使用默认班级
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
 classId = defaultClass.id
 }
 } else {
 // 没有指定班级，使用默认班级
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
 classId = defaultClass.id
 }

 // 创建用户和学生
 await prisma.user.create({
 data: {
 id: nanoid(),
 name,
 password: hashedPassword,
 role: 'STUDENT',
 updated_at: new Date(),
 students: {
 create: {
 id: nanoid(),
 student_no: studentNo,
 class_id: classId,
 updated_at: new Date(),
 },
 },
 },
 })

 results.success++
 } catch (error) {
 results.failed++
 results.errors.push(`学号 ${studentData.studentNo}: ${error}`)
 }
 }

 return successResponse(results, `导入完成，成功 ${results.success} 个，失败 ${results.failed} 个`)
 } catch (error) {
 console.error('批量导入学生错误:', error)
 return errorResponse('批量导入失败', 500)
 }
}
