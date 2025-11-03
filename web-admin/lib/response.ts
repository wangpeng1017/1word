import { NextResponse } from 'next/server'

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export function successResponse<T>(data: T, message?: string) {
  return NextResponse.json({
    success: true,
    data,
    message,
  } as ApiResponse<T>)
}

export function errorResponse(error: string, status: number = 400) {
  return NextResponse.json(
    {
      success: false,
      error,
    } as ApiResponse,
    { status }
  )
}

export function unauthorizedResponse(message: string = '未授权访问') {
  return errorResponse(message, 401)
}

export function notFoundResponse(message: string = '资源不存在') {
  return errorResponse(message, 404)
}

export function serverErrorResponse(message: string = '服务器错误') {
  return errorResponse(message, 500)
}
