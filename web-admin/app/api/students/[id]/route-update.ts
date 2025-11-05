// 这个文件用于参考，实际的route.ts已存在，需要添加PUT和DELETE方法

// PUT - 更新学生信息
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')
    
    const payload = verifyToken(token || '')
    if (!payload || payload.role !== 'TEACHER') {
      return unauthorizedResponse('只有教师可以更新学生信息')
    }

    const body = await request.json()
    const { name, studentNo, classId, grade } = body

    if (!name || !studentNo) {
      return errorResponse('姓名和学号不能为空')
    }

    // 获取学生信息
    const student = await prisma.student.findUnique({
      where: { id: params.id },
      include: { user: true },
    })

    if (!student) {
      return notFoundResponse('学生不存在')
    }

    // 检查学号是否被其他学生使用
    if (studentNo !== student.studentNo) {
      const existing = await prisma.student.findUnique({
        where: { studentNo },
      })
      if (existing) {
        return errorResponse('学号已被使用')
      }
    }

    // 更新用户信息
    await prisma.user.update({
      where: { id: student.userId },
      data: { name },
    })

    // 更新学生信息
    const updatedStudent = await prisma.student.update({
      where: { id: params.id },
      data: {
        studentNo,
        classId,
        grade,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        class: {
          select: {
            name: true,
            grade: true,
          },
        },
      },
    })

    return successResponse(updatedStudent, '学生信息更新成功')
  } catch (error) {
    console.error('更新学生信息错误:', error)
    return errorResponse('更新学生信息失败', 500)
  }
}

// DELETE - 删除学生
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')
    
    const payload = verifyToken(token || '')
    if (!payload || payload.role !== 'TEACHER') {
      return unauthorizedResponse('只有教师可以删除学生')
    }

    // 获取学生信息
    const student = await prisma.student.findUnique({
      where: { id: params.id },
      include: {
        studyRecords: true,
        wrongQuestions: true,
      },
    })

    if (!student) {
      return notFoundResponse('学生不存在')
    }

    // 检查是否有学习记录
    if (student.studyRecords.length > 0 || student.wrongQuestions.length > 0) {
      // 软删除：停用账号而不是物理删除
      await prisma.user.update({
        where: { id: student.userId },
        data: { isActive: false },
      })
      return successResponse(null, '学生账号已停用（保留学习数据）')
    }

    // 没有学习记录，可以完全删除
    await prisma.user.delete({
      where: { id: student.userId },
    })

    return successResponse(null, '学生删除成功')
  } catch (error) {
    console.error('删除学生错误:', error)
    return errorResponse('删除学生失败', 500)
  }
}
