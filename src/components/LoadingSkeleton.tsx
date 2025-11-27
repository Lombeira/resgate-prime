export function LoadingSkeleton() {
  return (
    <div className='animate-pulse space-y-4'>
      <div className='grid md:grid-cols-4 gap-6'>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className='bg-white rounded-lg p-6 shadow'>
            <div className='h-4 bg-gray-200 rounded w-1/2 mb-4'></div>
            <div className='h-8 bg-gray-200 rounded'></div>
          </div>
        ))}
      </div>

      <div className='bg-white rounded-lg shadow p-6'>
        <div className='h-6 bg-gray-200 rounded w-1/4 mb-4'></div>
        <div className='space-y-3'>
          {[1, 2, 3].map((i) => (
            <div key={i} className='h-12 bg-gray-100 rounded'></div>
          ))}
        </div>
      </div>
    </div>
  );
}
