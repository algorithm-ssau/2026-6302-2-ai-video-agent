type VideosPageProps = {
  searchParams: Promise<{ seriesId?: string }>
}

export default async function VideosPage({ searchParams }: VideosPageProps) {
  const { seriesId } = await searchParams

  return (
    <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-3xl font-bold text-slate-900">Generated videos</h1>
      <p className="mt-3 text-slate-600">
        {seriesId
          ? `This view is ready to show generated videos for series #${seriesId}.`
          : "This view is ready to show all generated videos."}
      </p>
      <p className="mt-2 text-sm text-slate-500">
        Connect your generation history table or storage listing here when the video output pipeline is ready.
      </p>
    </div>
  )
}
