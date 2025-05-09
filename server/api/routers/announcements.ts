import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, adminProtectedProcedure } from "server/api/trpc";
import { AnnouncementStatus, NotificationType } from "@prisma/client";

export const announcementRouter = createTRPCRouter({
  createAnnouncement: adminProtectedProcedure
    .input(
      z.object({
        title: z
          .string()
          .min(1, "Title is required")
          .max(255, "Title too long"),
        content: z.string().min(1, "Content is required"),
        status: z
          .nativeEnum(AnnouncementStatus)
          .default(AnnouncementStatus.DRAFT),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const authorId = ctx.session.user.id;
      if (!authorId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Admin user ID not found in session.",
        });
      }

      const announcement = await ctx.db.notification.create({
        data: {
          title: input.title,
          message: input.content, // Changed 'content' to 'message' to match the Prisma schema
          type: NotificationType.ANNOUNCEMENT,
          announcementStatus: input.status,
          authorId: authorId,
          publishedAt:
            input.status === AnnouncementStatus.PUBLISHED ? new Date() : null,
        },
      });
      return announcement;
    }),

  getAnnouncements: adminProtectedProcedure
    .input(
      z.object({
        status: z.nativeEnum(AnnouncementStatus).optional(),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(10),
        searchTerm: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { status, page, pageSize, searchTerm } = input;
      const whereClause: any = {
        type: NotificationType.ANNOUNCEMENT,
      };
      if (status) {
        whereClause.announcementStatus = status;
      }
      if (searchTerm) {
        whereClause.OR = [
          { title: { contains: searchTerm, mode: "insensitive" } },
          { message: { contains: searchTerm, mode: "insensitive" } },
        ];
      }

      const announcements = await ctx.db.notification.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { author: { select: { name: true, image: true } } },
      });
      const totalAnnouncements = await ctx.db.notification.count({
        where: whereClause,
      });
      return {
        announcements,
        totalPages: Math.ceil(totalAnnouncements / pageSize),
        currentPage: page,
        totalCount: totalAnnouncements,
      };
    }),

  getAnnouncementById: adminProtectedProcedure
    .input(z.object({ id: z.string().cuid("Invalid ID format") }))
    .query(async ({ ctx, input }) => {
      const announcement = await ctx.db.notification.findUnique({
        where: { id: input.id, type: NotificationType.ANNOUNCEMENT },
        include: { author: { select: { name: true, image: true } } },
      });
      if (!announcement) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Announcement not found.",
        });
      }
      return announcement;
    }),

  updateAnnouncement: adminProtectedProcedure
    .input(
      z.object({
        id: z.string().cuid("Invalid ID format"),
        title: z
          .string()
          .min(1, "Title is required")
          .max(255, "Title too long")
          .optional(),
        content: z.string().min(1, "Content is required").optional(),
        status: z.nativeEnum(AnnouncementStatus).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const existingAnnouncement = await ctx.db.notification.findUnique({
        where: { id, type: NotificationType.ANNOUNCEMENT },
      });

      if (!existingAnnouncement) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Announcement not found.",
        });
      }

      const updatePayload: {
        title?: string;
        content?: string;
        announcementStatus?: AnnouncementStatus;
        publishedAt?: Date | null;
        updatedAt: Date;
      } = {
        updatedAt: new Date(),
      };

      if (data.title !== undefined) updatePayload.title = data.title;
      if (data.content !== undefined) updatePayload.content = data.content;

      if (data.status) {
        updatePayload.announcementStatus = data.status;
        if (
          data.status === AnnouncementStatus.PUBLISHED &&
          existingAnnouncement.announcementStatus !==
            AnnouncementStatus.PUBLISHED
        ) {
          updatePayload.publishedAt = new Date();
        } else if (
          data.status !== AnnouncementStatus.PUBLISHED &&
          existingAnnouncement.publishedAt &&
          existingAnnouncement.announcementStatus ===
            AnnouncementStatus.PUBLISHED
        ) {
          // If unpublishing, you might want to clear publishedAt or keep the original date.
          // Keeping original for now. If it should be cleared: updatePayload.publishedAt = null;
        }
      }

      const updatedAnnouncement = await ctx.db.notification.update({
        where: { id },
        data: updatePayload,
      });
      return updatedAnnouncement;
    }),

  deleteAnnouncement: adminProtectedProcedure
    .input(z.object({ id: z.string().cuid("Invalid ID format") }))
    .mutation(async ({ ctx, input }) => {
      const announcement = await ctx.db.notification.findUnique({
        where: { id: input.id, type: NotificationType.ANNOUNCEMENT },
      });

      if (!announcement) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Announcement not found.",
        });
      }

      await ctx.db.notification.delete({ where: { id: input.id } });
      return { success: true, message: "Announcement deleted successfully." };
    }),
});
