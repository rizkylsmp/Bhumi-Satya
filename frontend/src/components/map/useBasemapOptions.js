import { useCallback, useEffect, useMemo, useState } from "react";
import { orthophotoService } from "../../services/api";
import { BASEMAP_OPTIONS } from "./basemapOptions";

let cachedOrthophotos = [];
let pendingRequest = null;

const loadPublishedOrthophotos = async () => {
  if (!pendingRequest) {
    pendingRequest = orthophotoService.published()
      .then((response) => {
        cachedOrthophotos = response.data?.data || [];
        return cachedOrthophotos;
      })
      .finally(() => {
        pendingRequest = null;
      });
  }
  return pendingRequest;
};

export const notifyBasemapOptionsChanged = () => {
  cachedOrthophotos = [];
  window.dispatchEvent(new CustomEvent("bhumi-satya:orthophotos-updated"));
};

export default function useBasemapOptions() {
  const [internalOptions, setInternalOptions] = useState(cachedOrthophotos);

  const refresh = useCallback(async () => {
    try {
      const options = await loadPublishedOrthophotos();
      setInternalOptions(options);
    } catch {
      setInternalOptions([]);
    }
  }, []);

  useEffect(() => {
    const initialTimer = window.setTimeout(refresh, 0);
    const handleChanged = () => refresh();
    window.addEventListener("bhumi-satya:orthophotos-updated", handleChanged);
    return () => {
      window.clearTimeout(initialTimer);
      window.removeEventListener(
        "bhumi-satya:orthophotos-updated",
        handleChanged,
      );
    };
  }, [refresh]);

  return useMemo(
    () => [...BASEMAP_OPTIONS, ...internalOptions],
    [internalOptions],
  );
}
