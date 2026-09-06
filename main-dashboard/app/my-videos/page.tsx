"use client";

import { useUser } from "@clerk/nextjs";
import {
  ChevronRight,
  Trash2,
  Eye,
  VideoIcon,
  FolderOpen,
  Copy,
  Check,
  MoveUpRight,
  AlertTriangle,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useVideos } from "../../hooks/useVideos";

const Page = () => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { isLoaded } = useUser();
  const { videosQuery } = useVideos();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

  const openDeleteModal = (id: string) => {
    setSelectedVideoId(id);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedVideoId(null);
  };

  const handleConfirmDelete = () => {
    console.log("Delete video:", selectedVideoId);
    closeDeleteModal();
  };

  const handleCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <>
      {!isLoaded ? (
        <div></div>
      ) : (
        <div className="text-foreground">
          {/* Breadcrumb */}
          <nav className="flex items-center font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground mb-6">
            <Link href="/" className="hover:text-foreground hover:underline">
              Dashboard
            </Link>
            <ChevronRight size={14} className="mx-2 opacity-60" />
            <span className="text-foreground font-medium">My Videos</span>
          </nav>

          {/* Title & Subtitle */}
          <div className="space-y-1 mb-8">
            <h1 className="font-display text-2xl font-semibold">My Videos</h1>
            <p className="text-sm text-muted-foreground max-w-100">
              View and manage your published videos
            </p>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead>
                <tr className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground border-b border-hairline">
                  <th className="px-4 py-3 font-semibold">Video</th>
                  <th className="px-4 py-3 font-semibold">Video ID</th>
                  <th className="px-4 py-3 font-semibold">Playlist</th>
                  <th className="px-4 py-3 font-semibold">Views</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {videosQuery.isLoading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-muted-foreground">
                      Loading videos...
                    </td>
                  </tr>
                ) : videosQuery.data?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-muted-foreground">
                      No videos found.
                    </td>
                  </tr>
                ) : (
                  videosQuery.data?.map((video) => (
                    <tr
                      key={video.id}
                      className="border-b border-hairline hover:bg-muted/50 transition-colors"
                    >
                      {/* Thumbnail + Title */}
                      <td className="px-4 py-4 flex items-center gap-3">
                        <img
                          src={video.thumbnailTrackingId ? `https://videon-bucket.s3.ap-south-1.amazonaws.com/${video.thumbnailTrackingId}` : "https://ik.imagekit.io/sjbr5usgh/Banners/WhatsApp%20Image%202025-04-08%20at%203.51.12%20PM.jpeg?updatedAt=1744410635917"}
                          alt={video.title}
                          className="w-12 h-8 rounded-sm object-cover border border-hairline"
                        />
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2 font-medium text-foreground">
                            <VideoIcon size={14} className="text-signal" />
                            {video.title}
                          </div>
                          <p
                            className="text-xs line-clamp-1 text-muted-foreground max-w-40"
                            title={video?.description || ""}
                          >
                            {video.description || "No description"}
                          </p>
                        </div>
                      </td>

                      {/* ID */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span className="truncate w-24 font-mono text-xs" title={video.id}>{video.id}</span>
                          <button
                            onClick={() => handleCopy(video.id)}
                            className="text-muted-foreground hover:text-signal transition"
                            title={
                              copiedId === video.id ? "Copied!" : "Copy Video ID"
                            }
                          >
                            {copiedId === video.id ? (
                              <Check
                                size={14}
                                className="text-signal scale-110"
                              />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Playlist */}
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-1 bg-signal/10 text-signal text-xs px-2 py-1 rounded-sm border border-signal/20 font-medium">
                          <FolderOpen size={12} />
                          {video.playlist_name || "Uncategorized"}
                        </span>
                      </td>

                      {/* Views */}
                      <td className="px-4 py-4 font-medium text-signal flex items-center gap-1 font-mono text-xs">
                        <Eye size={14} />
                        {video.totalViews.toLocaleString()}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <Link href={`/video/${video.id}`}>
                            <button
                              className="text-muted-foreground cursor-pointer hover:text-signal"
                              title="Analytics"
                            >
                              <MoveUpRight size={16} />
                            </button>
                          </Link>
                          <button
                            className="text-destructive hover:text-destructive/70"
                            onClick={() => openDeleteModal(video.id)}
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {showDeleteModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
                <div className="w-full max-w-md bg-card text-foreground rounded-sm shadow-xl border border-hairline">
                  {/* Title */}
                  <div className="px-6 pt-5 pb-3 border-b border-hairline">
                    <h2 className="font-display text-base font-semibold tracking-wide">
                      Confirm Video Deletion
                    </h2>
                  </div>

                  {/* Body */}
                  <div className="px-6 py-4 text-sm text-muted-foreground space-y-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="text-destructive mt-0.5 shrink-0" size={18} />
                      <p className="leading-relaxed">
                        This action will move the video to a deleted state. It
                        will be
                        <span className="text-destructive font-medium">
                          {" "}
                          permanently deleted after 31 days
                        </span>
                        . You will not be able to recover it once the grace
                        period ends.
                      </p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex justify-end items-center gap-3 px-6 pb-5">
                    <button
                      onClick={closeDeleteModal}
                      className="px-4 cursor-pointer py-1.5 text-sm rounded-sm border border-hairline text-muted-foreground hover:bg-muted transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmDelete}
                      className="px-4 cursor-pointer py-1.5 text-sm rounded-sm bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold transition"
                    >
                      Confirm Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Page;