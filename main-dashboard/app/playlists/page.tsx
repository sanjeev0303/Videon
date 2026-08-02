"use client";

import { ChevronRight, Plus, Edit3, Trash2, Loader2 } from "lucide-react";
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
    <div className="text-black dark:text-white">
      {/* Breadcrumb */}
      <nav className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-6">
        <Link href="/" className="hover:underline">
          Dashboard
        </Link>
        <ChevronRight size={16} className="mx-2" />
        <span className="text-gray-700 dark:text-gray-300 font-medium">
          Playlists
        </span>
      </nav>

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">My Playlists</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
            Organize your videos into curated playlists.
          </p>
        </div>
        <button
          onClick={() => {
            setPlaylistName("");
            setDescription("");
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition"
        >
          <Plus size={16} /> Create Playlist
        </button>
      </div>

      {/* Playlist Table */}
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="flex justify-center items-center py-12 text-gray-500 dark:text-gray-400 gap-2">
            <Loader2 className="animate-spin" size={18} />
            Loading playlists...
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-500">
            {(error as Error).message || "Failed to load playlists."}
          </div>
        ) : (
          <>
            <table className="min-w-full text-sm">
              <thead className="dark:bg-slate-900/50 border-b rounded-t dark:border-slate-900 text-gray-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Playlist Name</th>
                  <th className="px-4 py-3 text-left">Total Videos</th>
                  <th className="px-4 py-3 text-left">Created At</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>

              <tbody>
                {playlists && playlists.map((pl: any) => (
                  <tr
                    key={pl.id}
                    className="border-b dark:border-[#1f1f1f] hover:bg-gray-50 dark:hover:bg-[#1a1b1f]/50 transition"
                  >
                    <td className="px-4 py-4 font-medium">{pl.name}</td>
                    <td className="px-4 py-4 text-gray-600 dark:text-gray-400">
                      {pl.totalVideos ?? 0}
                    </td>
                    <td className="px-4 py-4 text-gray-600 dark:text-gray-400">
                      {timeAgo(pl.created_at)}
                    </td>
                    <td className="px-4 py-4 flex gap-3">
                      <button
                        className="text-gray-400 hover:text-indigo-500 transition"
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
                        className="text-red-500 hover:text-red-600 transition"
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

            {(!playlists || playlists.length === 0) && (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                No playlists found.
              </div>
            )}
          </>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/50 px-4">
          <div className="w-full max-w-md bg-gray-100 dark:bg-slate-900/50 text-white rounded-md shadow-lg border dark:border-slate-800/50">
            <div className="px-6 pt-5 pb-4 border-b dark:border-slate-800/50">
              <h2 className="text-xl font-semibold text-black dark:text-white">
                Create New Playlist
              </h2>
              <p className="text-sm text-black/50 dark:text-gray-400 mt-1 leading-snug">
                Playlists help you organize your videos internally. For example,
                you might group English tutorials and Spanish videos separately.
                These playlists are not visible to viewers.
              </p>
            </div>

            <div className="px-6 py-4 space-y-5 text-sm text-black dark:text-gray-300">
              {/* Playlist Name */}
              <div>
                <label className="block text-sm font-medium mb-1 text-black dark:text-white">
                  Playlist Name <span className="text-red-500">*</span>
                </label>
                <input
                  value={playlistName}
                  onChange={(e) => setPlaylistName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-md bg-gray-100 dark:bg-slate-900 border dark:border-slate-800 outline-none focus:ring-2 ring-indigo-500 text-black dark:text-white"
                  placeholder="e.g. English Tutorials"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-1 text-black dark:text-white">
                  Description <span className="text-gray-400">(optional)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-md bg-gray-100 dark:bg-slate-900 border dark:border-slate-800 outline-none focus:ring-2 ring-indigo-500 text-black dark:text-white"
                  placeholder="Add an optional note for yourself"
                  rows={3}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end items-center gap-3 px-6 pb-5">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 cursor-pointer py-1.5 text-sm rounded-md border dark:border-slate-600 dark:text-gray-300 text-black dark:hover:bg-slate-700 hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={createPlaylistMutation.isPending}
                className="px-4 cursor-pointer py-1.5 text-sm rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold transition disabled:opacity-50"
              >
                {createPlaylistMutation.isPending ? "Creating..." : "Create Playlist"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="w-full max-w-md dark:bg-slate-900/50 bg-gray-100 text-white rounded-md shadow-lg border dark:border-slate-900">
            {/* Title */}
            <div className="px-6 pt-5 pb-3 border-b dark:border-slate-900">
              <h2 className="text-base font-semibold text-black dark:text-white">
                Edit Playlist
              </h2>
              <p className="text-sm dark:text-gray-400 text-black/60 mt-1">
                Update your playlist name or internal note. This won’t affect
                your videos.
              </p>
            </div>

            {/* Body */}
            {playlist && (
              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="text-sm font-medium text-black dark:text-white">
                    Playlist Name *
                  </label>
                  <input
                    type="text"
                    value={playlistName}
                    onChange={(e) => setPlaylistName(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-md dark:bg-slate-900 border dark:border-slate-800 text-sm text-black dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-black dark:text-white">
                    Description{" "}
                    <span className="text-black/60 dark:text-gray-400">
                      (optional)
                    </span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-md bg-gray-100 dark:bg-slate-900 border dark:border-slate-800 text-sm text-black dark:text-white"
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex justify-end items-center gap-3 px-6 pb-5">
              <button
                onClick={() => setEditShowModal(false)}
                className="cursor-pointer px-4 py-1.5 text-sm rounded-md border dark:border-slate-600 text-black dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={updatePlaylistMutation.isPending}
                className="cursor-pointer px-4 py-1.5 text-sm rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold transition disabled:opacity-50"
              >
                {updatePlaylistMutation.isPending ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="w-full max-w-md dark:bg-slate-900 bg-gray-100 dark:text-white rounded-md shadow-lg border dark:border-slate-800">
            {/* Title */}
            <div className="px-6 pt-5 pb-3 border-b dark:border-slate-800">
              <h2 className="text-base font-semibold">
                Confirm Playlist Deletion
              </h2>
            </div>

            {/* Body */}
            <div className="px-6 py-4 text-sm dark:text-gray-300 space-y-3">
              <div className="flex items-start gap-2">
                <span className="text-yellow-400 text-lg">⚠️</span>
                <p className="leading-relaxed text-black dark:text-gray-300">
                  Are you sure you want to delete <strong className="text-red-400 font-semibold">{playlist?.name}</strong>? This playlist will be moved to a deleted state and will be{" "}
                  <strong className="text-red-400 font-medium">
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
                className="cursor-pointer px-4 py-1.5 text-sm rounded-md border dark:border-slate-600 dark:text-gray-300 dark:hover:bg-slate-700 transition hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deletePlaylistMutation.isPending}
                className="cursor-pointer px-4 py-1.5 text-sm rounded-md bg-red-600 hover:bg-red-700 text-white font-semibold transition disabled:opacity-50"
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
