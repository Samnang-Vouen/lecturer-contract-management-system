import React from "react";

/**
 * Infinite scroll sentinel component
 */
export default function InfiniteScrollSentinel({ sentinelRef, loading, hasMore }) {
  return (
    <div 
      ref={sentinelRef} 
      className="h-10 flex items-center justify-center text-xs text-gray-500"
    >
      {loading && hasMore && <span>Loading more...</span>}
      {!hasMore && !loading && <span className="text-gray-400">No more classes</span>}
    </div>
  );
}
