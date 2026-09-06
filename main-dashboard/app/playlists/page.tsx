"use client";

import { ChevronRight, Plus, Edit3, Trash2, Loader2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { usePlaylists } from "@/hooks/usePlaylists";

const timeAgo = (date: string | Date | null | undefined): string => {
  if (!date) return "-";
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const intervals: [number, string][] = [
    [31536000, "year"],
    [2592000, "month"],
    [604800, "week"],
    [86400, "day"],
    [3600, "hour"],
    [60, "minute"],
  ];
  for (const [secs, label] of intervals) {
    const count = Math.floor(seconds / secs);
    if (count >= 1) return `${count} ${label}${count > 1 ? "s" : ""} ago`;
  }
  return "just now";
};

const inputClasses =
  "w-full px-3 py-2 text-sm rounded-sm bg-muted/40 border border-input outline-none transition-[border-color,box-shadow] focus-visible:ring-2 focus-visible:ring-ring/50 text-foreground placeholder:text-muted-foreground";

const Page = () => {
  const {
    playlistsQuery,
    createPlaylistMutation,
    updatePlaylistMutation,
    deletePlaylistMutation,
  } = usePlaylists();

  const { data: playlists, isLoading, error } = playlistsQuery;

  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setEditShowModal] = useState(false);
  const [showDeleteModal, setDeleteShowModal] = useState(false);
  const [playlist, setPlaylist] = useState<any>({});
  const [playlistName, setPlaylistName] = useState("");
  const [description, setDescription] = useState("");

  const handleCreate = async () => {
    if (!playlistName.trim()) return;
    try {
      await createPlaylistMutation.mutateAsync({
        name: playlistName,
        description: description || undefined,
      });
      setPlaylistName("");
      setDescription("");
      setShowModal(false);
    } catch (err) {
      console.error("Failed to create playlist:", err);
    }
  };

  const handleSaveEdit = async () => {
    if (!playlistName.trim() || !playlist?.id) return;
    try {
      await updatePlaylistMutation.mutateAsync({
        id: playlist.id,
        name: playlistName,
        description: description || undefined,
      });
      setPlaylistName("");
      setDescription("");
      setEditShowModal(false);
      setPlaylist({});
    } catch (err) {
      console.error("Failed to edit playlist:", err);
    }
  };

  const handleConfirmDelete = async () => {
    if (!playlist?.id) return;
    try {
      await deletePlaylistMutation.mutateAsync(playlist.id);
      setDeleteShowModal(false);
      setPlaylist({});
    } catch (err) {
      console.error("Failed to delete playlist:", err);
    }
  };

  return (
    <div className="text-foreground">
      {/* Breadcrumb */}
      <nav className="flex items-center font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground hover:underline">
          Dashboard
        </Link>
        <ChevronRight size={14} className="mx-2 opacity-60" />
        <span className="text-foreground font-medium">Playlists</span>
      </nav>

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-semibold">My Playlists</h1>
          <p className="text-sm text-muted-foreground max-w-md">
            Organize your videos into curated playlists.
          </p>
        </div>
        <button
          onClick={() => {
            setPlaylistName("");
            setDescription("");
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-sm text-sm font-medium transition"
        >
          <Plus size={16} /> Create Playlist
        </button>
      </div>

      {/* Playlist Table */}
      <div className="rounded-sm border border-hairline bg-card overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center py-12 text-muted-foreground gap-2 font-mono text-sm">
            <Loader2 className="animate-spin" size={18} />
            Loading playlists...
          </div>
        ) : error ? (
          <div className="text-center py-12 text-destructive text-sm">
            {(error as Error).message || "Failed to load playlists."}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm divide-y divide-hairline">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="px-4 py-3 text-left font-mono text-[10px] font-semibold text-muted-foreground tracking-[0.18em] uppercase">
                      Playlist Name
                    </th>
                    <th className="px-4 py-3 text-left font-mono text-[10px] font-semibold text-muted-foreground tracking-[0.18em] uppercase">
                      Total Videos
                    </th>
                    <th className="px-4 py-3 text-left font-mono text-[10px] font-semibold text-muted-foreground tracking-[0.18em] uppercase">
                      Created At
                    </th>
                    <th className="px-4 py-3 text-left font-mono text-[10px] font-semibold text-muted-foreground tracking-[0.18em] uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-hairline">
                  {playlists && playlists.map((pl: any) => (
                    <tr
                      key={pl.id}
                      className="hover:bg-muted/60 transition-colors"
                    >
                      <td className="px-4 py-4 font-medium text-foreground">{pl.name}</td>
                      <td className="px-4 py-4 font-mono text-sm text-muted-foreground">
                        {String(pl.totalVideos ?? 0).padStart(2, "0")}
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">
                        {timeAgo(pl.created_at)}
                      </td>
                      <td className="px-4 py-4 flex gap-3">
                        <button
                          className="text-muted-foreground hover:text-signal transition-colors"
                          title="Edit"
                          onClick={() => {
                            setPlaylist(pl);
                            setPlaylistName(pl.name);
                            setDescription(pl.description || "");
                            setEditShowModal(true);
                          }}
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          className="text-destructive hover:text-destructive/80 transition-colors"
                          title="Delete"
                          onClick={() => {
                            setPlaylist(pl);
                            setDeleteShowModal(true);
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {(!playlists || playlists.length === 0) && (
              <div className="text-center py-12 text-muted-foreground text-sm">
                No playlists found.
              </div>
            )}
          </>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/50 px-4">
          <div className="w-full max-w-md bg-card text-foreground rounded-sm border border-hairline shadow-lg">
            <div className="px-6 pt-5 pb-4 border-b border-hairline">
              <h2 className="font-display text-lg font-semibold">
                Create New Playlist
              </h2>
              <p className="text-sm text-muted-foreground mt-1 leading-snug">
                Playlists help you organize your videos internally. For example,
                you might group English tutorials and Spanish videos separately.
                These playlists are not visible to viewers.
              </p>
            </div>

            <div className="px-6 py-4 space-y-5 text-sm">
              {/* Playlist Name */}
              <div>
                <label className="block text-sm font-medium mb-1 text-foreground">
                  Playlist Name <span className="text-destructive">*</span>
                </label>
                <input
                  value={playlistName}
                  onChange={(e) => setPlaylistName(e.target.value)}
                  className={inputClasses}
                  placeholder="e.g. English Tutorials"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-1 text-foreground">
                  Description <span className="text-muted-foreground">(optional)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`${inputClasses} min-h-24 resize-none`}
                  placeholder="Add an optional note for yourself"
                  rows={3}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end items-center gap-3 px-6 pb-5">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 cursor-pointer py-1.5 text-sm rounded-sm border border-hairline text-foreground hover:bg-muted transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={createPlaylistMutation.isPending}
                className="px-4 cursor-pointer py-1.5 text-sm rounded-sm bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition disabled:opacity-50"
              >
                {createPlaylistMutation.isPending ? "Creating..." : "Create Playlist"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-card text-foreground rounded-sm border border-hairline shadow-lg">
            {/* Title */}
            <div className="px-6 pt-5 pb-3 border-b border-hairline">
              <h2 className="font-display text-base font-semibold">
                Edit Playlist
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Update your playlist name or internal note. This won&apos;t affect
                your videos.
              </p>
            </div>

            {/* Body */}
            {playlist && (
              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground">
                    Playlist Name *
                  </label>
                  <input
                    type="text"
                    value={playlistName}
                    onChange={(e) => setPlaylistName(e.target.value)}
                    className={`mt-1 ${inputClasses}`}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">
                    Description{" "}
                    <span className="text-muted-foreground">
                      (optional)
                    </span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className={`mt-1 ${inputClasses} min-h-24 resize-none`}
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex justify-end items-center gap-3 px-6 pb-5">
              <button
                onClick={() => setEditShowModal(false)}
                className="cursor-pointer px-4 py-1.5 text-sm rounded-sm border border-hairline text-foreground hover:bg-muted transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={updatePlaylistMutation.isPending}
                className="cursor-pointer px-4 py-1.5 text-sm rounded-sm bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition disabled:opacity-50"
              >
                {updatePlaylistMutation.isPending ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-card text-foreground rounded-sm border border-hairline shadow-lg">
            {/* Title */}
            <div className="px-6 pt-5 pb-3 border-b border-hairline">
              <h2 className="font-display text-base font-semibold">
                Confirm Playlist Deletion
              </h2>
            </div>

            {/* Body */}
            <div className="px-6 py-4 text-sm text-muted-foreground space-y-3">
              <div className="flex items-start gap-2">
                <AlertTriangle
                  size={18}
                  className="text-destructive shrink-0 mt-0.5"
                />
                <p className="leading-relaxed">
                  Are you sure you want to delete{" "}
                  <strong className="text-destructive font-semibold">{playlist?.name}</strong>? This playlist will be moved to a deleted state and will be{" "}
                  <strong className="text-destructive font-medium">
                    permanently deleted after 24 hours
                  </strong>
                  . You won&apos;t be able to undo this action once the period
                  ends.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end items-center gap-3 px-6 pb-5">
              <button
                onClick={() => setDeleteShowModal(false)}
                className="cursor-pointer px-4 py-1.5 text-sm rounded-sm border border-hairline text-foreground hover:bg-muted transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deletePlaylistMutation.isPending}
                className="cursor-pointer px-4 py-1.5 text-sm rounded-sm bg-destructive hover:bg-destructive/90 text-white font-semibold transition disabled:opacity-50"
              >
                {deletePlaylistMutation.isPending ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Page;