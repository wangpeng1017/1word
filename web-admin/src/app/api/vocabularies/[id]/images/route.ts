import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/vocabularies/[id]/images
 * 获取指定词汇的所有图片
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const vocabularyId = params.id;

    // 检查词汇是否存在
    const vocabulary = await prisma.vocabulary.findUnique({
      where: { id: vocabularyId }
    });

    if (!vocabulary) {
      return NextResponse.json(
        { error: '词汇不存在' },
        { status: 404 }
      );
    }

    // 获取该词汇的所有图片
    const images = await prisma.wordImage.findMany({
      where: { vocabularyId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: images
    });

  } catch (error) {
    console.error('获取图片列表失败:', error);
    return NextResponse.json(
      { error: '获取图片列表失败' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/vocabularies/[id]/images
 * 添加图片到指定词汇
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const vocabularyId = params.id;
    const body = await request.json();
    const { imageUrl, description } = body;

    // 验证必填字段
    if (!imageUrl) {
      return NextResponse.json(
        { error: '图片URL不能为空' },
        { status: 400 }
      );
    }

    // 检查词汇是否存在
    const vocabulary = await prisma.vocabulary.findUnique({
      where: { id: vocabularyId }
    });

    if (!vocabulary) {
      return NextResponse.json(
        { error: '词汇不存在' },
        { status: 404 }
      );
    }

    // 创建图片记录
    const image = await prisma.wordImage.create({
      data: {
        vocabularyId,
        imageUrl,
        description: description || null
      }
    });

    return NextResponse.json({
      success: true,
      data: image
    }, { status: 201 });

  } catch (error) {
    console.error('添加图片失败:', error);
    return NextResponse.json(
      { error: '添加图片失败' },
      { status: 500 }
    );
  }
}
