import { ExternalLink, MapPin, Navigation } from 'lucide-react';

const DEFAULT_LOCATION = 'Mumbai, Maharashtra, India';

const GoogleMapEmbed = ({
  address,
  title = 'Pickup location',
  heightClass = 'h-96',
  showActions = true,
}) => {
  const mapAddress = address?.trim() || DEFAULT_LOCATION;
  const encodedAddress = encodeURIComponent(mapAddress);
  const embedUrl = `https://www.google.com/maps?q=${encodedAddress}&output=embed`;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;

  return (
    <div className={`relative w-full ${heightClass} overflow-hidden bg-slate-200`}>
      <iframe
        title={title}
        src={embedUrl}
        className="absolute inset-0 h-full w-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />

      {showActions && (
        <div className="absolute left-4 right-4 top-4 flex flex-col gap-3 sm:left-6 sm:right-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-xl rounded-lg border border-white/80 bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <MapPin className="h-4 w-4 text-primary-600" />
              <span>{title}</span>
            </div>
            <p className="mt-1 line-clamp-2 text-sm text-slate-600">{mapAddress}</p>
          </div>

          <div className="flex shrink-0 gap-2">
            <a
              href={directionsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary-600 px-3 text-sm font-bold text-white shadow-lg transition hover:bg-primary-700"
            >
              <Navigation className="h-4 w-4" />
              Directions
            </a>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-lg transition hover:bg-slate-50"
              aria-label="Open location in Google Maps"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleMapEmbed;
