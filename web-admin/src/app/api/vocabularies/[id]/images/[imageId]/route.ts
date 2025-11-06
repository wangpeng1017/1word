import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * DELETE /api/vocabularies/[id]/images/[imageId]
 * 删除指定图片
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; imageId: string } }
) {
  try {
    const { id: vocabularyId, imageId } = params;

    // 检查图片是否存在且属于该词汇
    const image = await prisma.wordImage.findFirst({
      where: {
        id: imageId,
        vocabularyId
      }
    });

    if (!image) {
      return NextResponse.json(
        { error: '图片不存在或不属于该词汇' },
        { status: 404 }
      );
    }

    // 删除图片
    await prisma.wordImage.delete({
      where: { id: imageId }
    });

    return NextResponse.json({
      success: true,
      message: '图片删除成功'
    });

  } catch (error) {
    console.error('删除图片失败:', error);
    return NextResponse.json(
      { error: '删除图片失败' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/vocabularies/[id]/images/[imageId]
 * 更新图片信息
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; imageId: string } }
) {
  try {
    const { id: vocabularyId, imageId } = params;
    const body = await request.json();
    const { imageUrl, description } = body;

    // 检查图片是否存在且属于该词汇
    const image = await prisma.wordImage.findFirst({
      where: {
        id: imageId,
        vocabularyId
      }
    });

    if (!image) {
      return NextResponse.json(
        { error: '图片不存在或不属于该词汇' },
        { status: 404 }
      );
    }

    // 更新图片
    const updatedImage = await prisma.wordImage.update({
      where: { id: imageId },
      data: {
        ...(imageUrl && { imageUrl }),
        ...(description !== undefined && { description })
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedImage
    });

  } catch (error) {
    console.error('更新图片失败:', error);
    return NextResponse.json(
      { error: '更新图片失败' },
      { status: 500 }
    );
  }
}
