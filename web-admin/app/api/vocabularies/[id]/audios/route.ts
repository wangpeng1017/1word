import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/vocabularies/[id]/audios
 * 获取指定词汇的所有音频
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

    // 获取该词汇的所有音频
    const audios = await prisma.wordAudio.findMany({
      where: { vocabularyId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: audios
    });

  } catch (error) {
    console.error('获取音频列表失败:', error);
    return NextResponse.json(
      { error: '获取音频列表失败' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/vocabularies/[id]/audios
 * 添加音频到指定词汇
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const vocabularyId = params.id;
    const body = await request.json();
    const { audioUrl, accent = 'US', duration } = body;

    // 验证必填字段
    if (!audioUrl) {
      return NextResponse.json(
        { error: '音频URL不能为空' },
        { status: 400 }
      );
    }

    // 验证口音类型
    if (!['US', 'UK'].includes(accent)) {
      return NextResponse.json(
        { error: '口音类型必须是 US 或 UK' },
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

    // 创建音频记录
    const audio = await prisma.wordAudio.create({
      data: {
        vocabularyId,
        audioUrl,
        accent,
        duration: duration ? parseInt(duration) : null
      }
    });

    return NextResponse.json({
      success: true,
      data: audio
    }, { status: 201 });

  } catch (error) {
    console.error('添加音频失败:', error);
    return NextResponse.json(
      { error: '添加音频失败' },
      { status: 500 }
    );
  }
}
