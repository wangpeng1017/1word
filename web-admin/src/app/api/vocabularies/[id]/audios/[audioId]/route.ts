import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * DELETE /api/vocabularies/[id]/audios/[audioId]
 * 删除指定音频
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; audioId: string } }
) {
  try {
    const { id: vocabularyId, audioId } = params;

    // 检查音频是否存在且属于该词汇
    const audio = await prisma.wordAudio.findFirst({
      where: {
        id: audioId,
        vocabularyId
      }
    });

    if (!audio) {
      return NextResponse.json(
        { error: '音频不存在或不属于该词汇' },
        { status: 404 }
      );
    }

    // 删除音频
    await prisma.wordAudio.delete({
      where: { id: audioId }
    });

    return NextResponse.json({
      success: true,
      message: '音频删除成功'
    });

  } catch (error) {
    console.error('删除音频失败:', error);
    return NextResponse.json(
      { error: '删除音频失败' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/vocabularies/[id]/audios/[audioId]
 * 更新音频信息
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; audioId: string } }
) {
  try {
    const { id: vocabularyId, audioId } = params;
    const body = await request.json();
    const { audioUrl, accent, duration } = body;

    // 检查音频是否存在且属于该词汇
    const audio = await prisma.wordAudio.findFirst({
      where: {
        id: audioId,
        vocabularyId
      }
    });

    if (!audio) {
      return NextResponse.json(
        { error: '音频不存在或不属于该词汇' },
        { status: 404 }
      );
    }

    // 验证口音类型
    if (accent && !['US', 'UK'].includes(accent)) {
      return NextResponse.json(
        { error: '口音类型必须是 US 或 UK' },
        { status: 400 }
      );
    }

    // 更新音频
    const updatedAudio = await prisma.wordAudio.update({
      where: { id: audioId },
      data: {
        ...(audioUrl && { audioUrl }),
        ...(accent && { accent }),
        ...(duration !== undefined && { duration: duration ? parseInt(duration) : null })
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedAudio
    });

  } catch (error) {
    console.error('更新音频失败:', error);
    return NextResponse.json(
      { error: '更新音频失败' },
      { status: 500 }
    );
  }
}
