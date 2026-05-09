"use client";

import { useEffect, useRef, useState, useId, useCallback } from "react";
import {
  Map,
  MapMarker,
  MarkerContent,
  MarkerLabel,
  MarkerTooltip,
  MarkerPopup,
  MapPopup,
  MapControls,
  useMap,
  type MapRef,
} from "@/components/ui/map";
import { Button } from "@/components/ui/button";
import {
  Users, UserPlus, Locate, Loader2, MapPin,
  Radio, Navigation, RefreshCw, AlertCircle, CheckCircle2, User,
} from "lucide-react";

const API_URL = "https://how-geo-location-works.onrender.com";

interface NearbyUser { id?: string; name: string; latitude: number; longitude: number; distance: number; }
interface UserLocation { lat: number; lng: number; accuracy: number; }

// ─── Live location dot ────────────────────────────────────────────────────────
function LiveLocationLayer({ location }: { location: UserLocation | null }) {
  const { map, isLoaded } = useMap();
  const uid = useId();
  const ids = { src: `ll-src-${uid}`, acc: `ll-acc-${uid}`, pulse: `ll-pulse-${uid}`, dot: `ll-dot-${uid}` };
  useEffect(() => {
    if (!map || !isLoaded) return;
    map.addSource(ids.src, { type: "geojson", data: { type: "FeatureCollection", features: [] } });
    map.addLayer({ id: ids.acc,   type: "circle", source: ids.src, paint: { "circle-radius": 36, "circle-color": "#3b82f6", "circle-opacity": 0.1, "circle-stroke-color": "#3b82f6", "circle-stroke-width": 1, "circle-stroke-opacity": 0.25 } });
    map.addLayer({ id: ids.pulse, type: "circle", source: ids.src, paint: { "circle-radius": 14, "circle-color": "#ffffff", "circle-opacity": 0.35 } });
    map.addLayer({ id: ids.dot,   type: "circle", source: ids.src, paint: { "circle-radius": 7,  "circle-color": "#3b82f6", "circle-stroke-color": "#ffffff", "circle-stroke-width": 3, "circle-opacity": 1 } });
    return () => { try { [ids.dot, ids.pulse, ids.acc].forEach(l => { if (map.getLayer(l)) map.removeLayer(l); }); if (map.getSource(ids.src)) map.removeSource(ids.src); } catch { /**/ } };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, isLoaded]);
  useEffect(() => {
    if (!map || !isLoaded) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s = map.getSource(ids.src) as any; if (!s) return;
    s.setData({ type: "FeatureCollection", features: location ? [{ type: "Feature", properties: {}, geometry: { type: "Point", coordinates: [location.lng, location.lat] } }] : [] });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, map, isLoaded]);
  return null;
}

// ─── Radius circle ────────────────────────────────────────────────────────────
function RadiusLayer({ location, radiusMeters }: { location: UserLocation | null; radiusMeters: number }) {
  const { map, isLoaded } = useMap();
  const uid = useId();
  const ids = { src: `r-src-${uid}`, fill: `r-fill-${uid}`, line: `r-line-${uid}` };
  function circle(lng: number, lat: number, r: number): GeoJSON.Feature {
    const pts: [number,number][] = [], e = 6371000;
    for (let i = 0; i <= 64; i++) { const a = (i/64)*2*Math.PI, dLat=(r/e)*(180/Math.PI), dLng=dLat/Math.cos(lat*Math.PI/180); pts.push([lng+dLng*Math.cos(a), lat+dLat*Math.sin(a)]); }
    return { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [pts] } };
  }
  useEffect(() => {
    if (!map || !isLoaded) return;
    map.addSource(ids.src, { type: "geojson", data: { type: "FeatureCollection", features: [] } });
    map.addLayer({ id: ids.fill, type: "fill", source: ids.src, paint: { "fill-color": "#3b82f6", "fill-opacity": 0.06 } });
    map.addLayer({ id: ids.line, type: "line", source: ids.src, paint: { "line-color": "#3b82f6", "line-width": 1.5, "line-opacity": 0.4, "line-dasharray": [4,4] } });
    return () => { try { [ids.fill, ids.line].forEach(l => { if (map.getLayer(l)) map.removeLayer(l); }); if (map.getSource(ids.src)) map.removeSource(ids.src); } catch { /**/ } };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, isLoaded]);
  useEffect(() => {
    if (!map || !isLoaded) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s = map.getSource(ids.src) as any; if (!s) return;
    s.setData({ type: "FeatureCollection", features: location ? [circle(location.lng, location.lat, radiusMeters)] : [] });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, radiusMeters, map, isLoaded]);
  return null;
}

// ─── Nearby users layer with full highlight support ───────────────────────────
function NearbyUsersLayer({ users, selectedId, onSelect }: {
  users: NearbyUser[];
  selectedId: string | number | null;
  onSelect: (u: NearbyUser, coords: [number,number], id: string|number) => void;
}) {
  const { map, isLoaded } = useMap();
  const uid = useId();
  const ids = { src: `nu-src-${uid}`, glow: `nu-glow-${uid}`, ring: `nu-ring-${uid}`, dot: `nu-dot-${uid}`, label: `nu-label-${uid}` };

  useEffect(() => {
    if (!map || !isLoaded) return;
    map.addSource(ids.src, { type: "geojson", data: { type: "FeatureCollection", features: [] } });

    // Outer glow — bigger + brighter when selected
    map.addLayer({ id: ids.glow, type: "circle", source: ids.src, paint: {
      "circle-radius":  ["case", ["==", ["get","selected"], true], 30, 19] as maplibregl.ExpressionSpecification,
      "circle-color":   ["case", ["==", ["get","selected"], true], "#ea580c", "#f97316"] as maplibregl.ExpressionSpecification,
      "circle-opacity": ["case", ["==", ["get","selected"], true], 0.40, 0.15] as maplibregl.ExpressionSpecification,
      "circle-blur": 0.5,
    }});

    // White border ring
    map.addLayer({ id: ids.ring, type: "circle", source: ids.src, paint: {
      "circle-radius": ["case", ["==", ["get","selected"], true], 18, 13] as maplibregl.ExpressionSpecification,
      "circle-color": "#ffffff", "circle-opacity": 1,
    }});

    // Coloured inner dot
    map.addLayer({ id: ids.dot, type: "circle", source: ids.src, paint: {
      "circle-radius": ["case", ["==", ["get","selected"], true], 14, 10] as maplibregl.ExpressionSpecification,
      "circle-color":  ["case", ["==", ["get","selected"], true], "#ea580c", "#f97316"] as maplibregl.ExpressionSpecification,
      "circle-stroke-color": "#ffffff",
      "circle-stroke-width": ["case", ["==", ["get","selected"], true], 2.5, 0] as maplibregl.ExpressionSpecification,
      "circle-opacity": 1,
    }});

    // Name label — orange + bold when selected
    map.addLayer({ id: ids.label, type: "symbol", source: ids.src,
      layout: {
        "text-field": ["get","name"] as maplibregl.ExpressionSpecification,
        "text-size": ["case", ["==", ["get","selected"], true], 13, 11] as maplibregl.ExpressionSpecification,
        "text-offset": [0, 1.7], "text-anchor": "top", "text-allow-overlap": false,
      },
      paint: {
        "text-color": ["case", ["==", ["get","selected"], true], "#ea580c", "#334155"] as maplibregl.ExpressionSpecification,
        "text-halo-color": "#ffffff", "text-halo-width": 2,
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onClick = (e: any) => {
      if (!e.features?.length) return;
      const f = e.features[0];
      const coords = (f.geometry as GeoJSON.Point).coordinates as [number,number];
      onSelect({ name: f.properties?.name??"", latitude: coords[1], longitude: coords[0], distance: f.properties?.distance??0 }, coords, f.properties?.id??0);
    };
    const onEnter = () => { map.getCanvas().style.cursor = "pointer"; };
    const onLeave = () => { map.getCanvas().style.cursor = ""; };
    map.on("click", ids.dot, onClick); map.on("click", ids.ring, onClick);
    map.on("mouseenter", ids.dot, onEnter); map.on("mouseleave", ids.dot, onLeave);

    return () => {
      map.off("click", ids.dot, onClick); map.off("click", ids.ring, onClick);
      map.off("mouseenter", ids.dot, onEnter); map.off("mouseleave", ids.dot, onLeave);
      try { [ids.label, ids.dot, ids.ring, ids.glow].forEach(l => { if (map.getLayer(l)) map.removeLayer(l); }); if (map.getSource(ids.src)) map.removeSource(ids.src); } catch { /**/ }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, isLoaded]);

  useEffect(() => {
    if (!map || !isLoaded) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s = map.getSource(ids.src) as any; if (!s) return;
    s.setData({
      type: "FeatureCollection",
      features: users.map((u, i) => ({
        type: "Feature",
        properties: { name: u.name, distance: u.distance, id: u.id??i, selected: (u.id??i) === selectedId },
        geometry: { type: "Point", coordinates: [u.longitude, u.latitude] },
      })),
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, selectedId, map, isLoaded]);

  return null;
}

function fmtDist(m: number) { return m >= 1000 ? `${(m/1000).toFixed(1)} km` : `${Math.round(m)} m`; }

// ─── App ──────────────────────────────────────────────────────────────────────
export default function GeoMatching() {
  const mapRef = useRef<MapRef>(null);
  const [name, setName] = useState("");
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);
  const [registerStatus, setRegisterStatus] = useState<"idle"|"ok"|"err">("idle");
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<{ user: NearbyUser; coords: [number,number]; id: string|number } | null>(null);
  const [radius, setRadius] = useState(5000);
  const [showRadius, setShowRadius] = useState(true);
  const [panelTab, setPanelTab] = useState<"register"|"nearby">("register");

  const getLocation = useCallback((): Promise<UserLocation> => new Promise((res, rej) => {
    if (userLocation) { res(userLocation); return; }
    if (!navigator.geolocation) { rej(new Error("Geolocation not supported")); return; }
    setLocating(true); setLocError(null);
    navigator.geolocation.getCurrentPosition(
      pos => { const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }; setUserLocation(loc); setLocating(false); mapRef.current?.flyTo({ center: [loc.lng, loc.lat], zoom: 13, duration: 1200 }); res(loc); },
      err => { setLocating(false); setLocError(err.message); rej(err); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }), [userLocation]);

  const registerUser = useCallback(async () => {
    if (!name.trim()) return;
    setRegistering(true); setRegisterStatus("idle");
    try {
      const loc = await getLocation();
      const r = await fetch(`${API_URL}/users`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ name: name.trim(), latitude: loc.lat, longitude: loc.lng }) });
      if (!r.ok) throw new Error();
      setRegisterStatus("ok"); setPanelTab("nearby");
    } catch { setRegisterStatus("err"); } finally { setRegistering(false); }
  }, [name, getLocation]);

  const getNearby = useCallback(async () => {
    setFetching(true); setFetchError(null);
    try {
      const loc = await getLocation();
      const r = await fetch(`${API_URL}/nearby?lat=${loc.lat}&lng=${loc.lng}&radius=${radius}`);
      if (!r.ok) throw new Error();
      const users: NearbyUser[] = await r.json();
      setNearbyUsers(users);
      if (users.length > 0) {
        const lngs = [loc.lng, ...users.map(u=>u.longitude)], lats = [loc.lat, ...users.map(u=>u.latitude)];
        mapRef.current?.fitBounds([[Math.min(...lngs), Math.min(...lats)],[Math.max(...lngs), Math.max(...lats)]], { padding:80, duration:1000 });
      }
    } catch { setFetchError("Failed to fetch nearby users. Check connection."); } finally { setFetching(false); }
  }, [getLocation, radius]);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-background font-sans">

      {/* PANEL */}
      <div className="absolute left-3 top-3 z-20 flex w-72 flex-col rounded-2xl border border-border bg-background/97 shadow-2xl backdrop-blur-xl overflow-hidden max-h-[calc(100vh-24px)]">

        {/* Header */}
        <div className="flex items-center gap-2.5 border-b border-border px-4 py-3.5 shrink-0">
          <div className="flex size-8 items-center justify-center rounded-xl bg-primary"><Radio className="size-4 text-primary-foreground" /></div>
          <div><h1 className="text-sm font-black tracking-tight text-foreground">Geo Matching</h1><p className="text-[10px] text-muted-foreground">Find people near you</p></div>
          {userLocation && <div className="ml-auto flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5"><div className="size-1.5 rounded-full bg-blue-500 animate-pulse" /><span className="text-[9px] font-semibold text-blue-600 dark:text-blue-400">Live</span></div>}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border shrink-0">
          {(["register","nearby"] as const).map(tab => (
            <button key={tab} onClick={() => setPanelTab(tab)}
              className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-semibold uppercase tracking-wide transition-colors ${panelTab===tab ? "border-b-2 border-primary text-primary bg-primary/5" : "text-muted-foreground hover:text-foreground"}`}>
              {tab==="register" ? <UserPlus className="size-3.5" /> : <Users className="size-3.5" />}{tab}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">

          {/* Register */}
          {panelTab === "register" && (
            <div className="p-4 space-y-3">
              <p className="text-xs text-muted-foreground">Enter your name and allow location to register yourself on the map.</p>
              <div className="relative">
                <User className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <input className="w-full rounded-xl border border-border bg-muted/20 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary/50 focus:bg-background transition-colors placeholder:text-muted-foreground"
                  placeholder="Your name" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key==="Enter" && registerUser()} />
              </div>
              <Button className="w-full gap-2" onClick={registerUser} disabled={!name.trim()||registering}>
                {registering ? <><Loader2 className="size-4 animate-spin"/>Registering…</> : <><MapPin className="size-4"/>Register My Location</>}
              </Button>
              {locating && <div className="flex items-center gap-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 px-3 py-2 text-xs text-blue-600 dark:text-blue-400"><Loader2 className="size-3.5 animate-spin shrink-0"/>Getting your location…</div>}
              {locError && <div className="flex items-center gap-2 rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive"><AlertCircle className="size-3.5 shrink-0"/>{locError}</div>}
              {registerStatus==="ok" && <div className="flex items-center gap-2 rounded-xl bg-green-50 dark:bg-green-950/40 px-3 py-2 text-xs text-green-700 dark:text-green-400"><CheckCircle2 className="size-3.5 shrink-0"/>Registered! Switch to Nearby tab.</div>}
              {registerStatus==="err" && <div className="flex items-center gap-2 rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive"><AlertCircle className="size-3.5 shrink-0"/>Registration failed. Try again.</div>}
              {!userLocation && !locating && (
                <button onClick={() => getLocation()} className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-2 text-xs text-muted-foreground hover:text-foreground hover:border-muted-foreground/50 transition-colors">
                  <Locate className="size-3.5"/>Just capture my location
                </button>
              )}
              {userLocation && (
                <div className="rounded-xl bg-muted/30 px-3 py-2 text-xs text-muted-foreground space-y-0.5">
                  <p className="font-semibold text-foreground">📍 Location captured</p>
                  <p className="tabular-nums">{userLocation.lat.toFixed(5)}, {userLocation.lng.toFixed(5)}</p>
                  <p>±{Math.round(userLocation.accuracy)}m accuracy</p>
                </div>
              )}
            </div>
          )}

          {/* Nearby */}
          {panelTab === "nearby" && (
            <div className="flex flex-col">
              <div className="p-4 space-y-3 border-b border-border">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground font-medium">Search radius</span>
                    <span className="font-bold text-foreground tabular-nums">{radius>=1000 ? `${(radius/1000).toFixed(1)} km` : `${radius} m`}</span>
                  </div>
                  <input type="range" min={500} max={50000} step={500} value={radius} onChange={e=>setRadius(Number(e.target.value))} className="w-full accent-primary"/>
                  <div className="flex justify-between text-[9px] text-muted-foreground/50"><span>500m</span><span>50 km</span></div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Show radius on map</span>
                  <button onClick={() => setShowRadius(s=>!s)} className={`relative h-5 w-9 rounded-full transition-colors ${showRadius?"bg-primary":"bg-muted"}`}>
                    <div className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform ${showRadius?"translate-x-4":"translate-x-0.5"}`}/>
                  </button>
                </div>
                <Button className="w-full gap-2" onClick={getNearby} disabled={fetching}>
                  {fetching ? <><Loader2 className="size-4 animate-spin"/>Searching…</> : <><RefreshCw className="size-4"/>Find Nearby Users</>}
                </Button>
                {fetchError && <div className="flex items-center gap-2 rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive"><AlertCircle className="size-3.5 shrink-0"/>{fetchError}</div>}
              </div>

              {/* User list */}
              <div className="p-3 space-y-2">
                {nearbyUsers.length===0 && !fetching && (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    <Users className="mx-auto mb-2 size-8 opacity-20"/>
                    <p>No nearby users found yet.</p>
                    <p className="mt-1 opacity-60">Click "Find Nearby Users" to search.</p>
                  </div>
                )}

                {nearbyUsers.map((u, i) => {
                  const id = u.id ?? i;
                  const isSel = selectedUser?.id === id;
                  return (
                    <button key={id}
                      onClick={() => { mapRef.current?.flyTo({ center:[u.longitude,u.latitude], zoom:14, duration:900 }); setSelectedUser({ user:u, coords:[u.longitude,u.latitude], id }); }}
                      className={`w-full rounded-xl border px-3 py-2.5 text-left transition-all duration-200 ${
                        isSel
                          ? "border-orange-400 bg-orange-50 dark:bg-orange-950/40 ring-2 ring-orange-400/30 shadow-md"
                          : "border-border bg-muted/10 hover:bg-orange-50/60 hover:border-orange-200 dark:hover:bg-orange-950/20 dark:hover:border-orange-800"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {/* Avatar */}
                        <div className={`flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-black transition-all ${
                          isSel ? "bg-orange-500 text-white shadow-lg shadow-orange-500/40 ring-2 ring-orange-300" : "bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400"
                        }`}>
                          {u.name[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold text-sm truncate ${isSel ? "text-orange-700 dark:text-orange-300" : "text-foreground"}`}>{u.name}</p>
                          <p className="text-[10px] text-muted-foreground tabular-nums">{u.latitude.toFixed(4)}, {u.longitude.toFixed(4)}</p>
                        </div>
                        {/* Distance badge */}
                        <div className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${isSel ? "bg-orange-500 text-white" : "bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400"}`}>
                          {fmtDist(u.distance)}
                        </div>
                      </div>
                      {/* Selected bar */}
                      {isSel && (
                        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-orange-600 dark:text-orange-400 font-semibold">
                          <div className="size-1.5 rounded-full bg-orange-500 animate-pulse"/>Highlighted on map
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats bar */}
      {nearbyUsers.length > 0 && (
        <div className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2">
          <div className="flex items-center gap-4 rounded-2xl border border-border bg-background/97 px-5 py-2.5 shadow-2xl backdrop-blur-xl text-sm">
            <div className="flex items-center gap-1.5 text-orange-500"><Users className="size-4"/><span className="font-black text-base">{nearbyUsers.length}</span></div>
            <div className="h-4 w-px bg-border"/>
            <span className="text-muted-foreground">within <span className="font-semibold text-foreground">{radius>=1000?`${(radius/1000).toFixed(0)} km`:`${radius}m`}</span></span>
            <div className="h-4 w-px bg-border"/>
            <span className="text-muted-foreground text-xs">nearest: <span className="font-semibold text-foreground">{fmtDist(Math.min(...nearbyUsers.map(u=>u.distance)))}</span></span>
          </div>
        </div>
      )}

      {/* MAP */}
      <Map ref={mapRef} center={[78.9629, 20.5937]} zoom={4} className="h-full w-full" fadeDuration={200}>
        <MapControls position="top-right" showZoom showCompass showLocate showFullscreen/>
        <LiveLocationLayer location={userLocation}/>
        {showRadius && <RadiusLayer location={userLocation} radiusMeters={radius}/>}
        <NearbyUsersLayer users={nearbyUsers} selectedId={selectedUser?.id??null} onSelect={(u,coords,id)=>setSelectedUser({user:u,coords,id})}/>

        {/* My marker */}
        {userLocation && (
          <MapMarker longitude={userLocation.lng} latitude={userLocation.lat}>
            <MarkerContent>
              <div className="size-6 rounded-full cursor-pointer opacity-0"/>
              <MarkerLabel position="top" className="rounded-full bg-blue-500 px-2 py-0.5 text-[10px] font-black text-white shadow">You</MarkerLabel>
            </MarkerContent>
            <MarkerTooltip>Your location — click for details</MarkerTooltip>
            <MarkerPopup>
              <div className="space-y-1.5 min-w-44">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Your Location</p>
                <p className="font-semibold text-foreground">📍 {name||"Me"}</p>
                <p className="text-xs text-muted-foreground tabular-nums">{userLocation.lat.toFixed(5)}, {userLocation.lng.toFixed(5)}</p>
                <p className="text-[10px] text-muted-foreground">±{Math.round(userLocation.accuracy)}m accuracy</p>
                <Button size="sm" className="w-full mt-1 gap-1.5 text-xs" onClick={()=>{getNearby();setPanelTab("nearby");}}>
                  <Navigation className="size-3"/>Find nearby from here
                </Button>
              </div>
            </MarkerPopup>
          </MapMarker>
        )}

        {/* Selected user popup */}
        {selectedUser && (
          <MapPopup longitude={selectedUser.coords[0]} latitude={selectedUser.coords[1]} onClose={()=>setSelectedUser(null)} closeButton closeOnClick={false} focusAfterOpen={false} offset={22}>
            <div className="space-y-2 min-w-48">
              <div className="flex items-center gap-2.5">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-orange-500 text-base font-black text-white shadow-lg shadow-orange-500/40 ring-2 ring-orange-300">
                  {selectedUser.user.name[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-foreground text-sm">{selectedUser.user.name}</p>
                  <p className="text-[10px] text-orange-600 dark:text-orange-400 font-semibold flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-orange-500 inline-block animate-pulse"/>
                    {fmtDist(selectedUser.user.distance)} away
                  </p>
                </div>
              </div>
              <div className="rounded-xl bg-muted/40 px-2.5 py-2 space-y-1.5 text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">Latitude</span><span className="font-mono font-semibold text-foreground">{selectedUser.user.latitude.toFixed(5)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Longitude</span><span className="font-mono font-semibold text-foreground">{selectedUser.user.longitude.toFixed(5)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Distance</span><span className="font-bold text-orange-600">{fmtDist(selectedUser.user.distance)}</span></div>
              </div>
            </div>
          </MapPopup>
        )}

        {/* You are here popup */}
        {userLocation && (
          <MapPopup longitude={userLocation.lng} latitude={userLocation.lat} closeButton={false} closeOnClick={false} focusAfterOpen={false} offset={22} className="p-0">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs">
              <div className="size-1.5 rounded-full bg-blue-500 animate-pulse"/>
              <span className="font-semibold text-blue-600 dark:text-blue-400">You are here</span>
            </div>
          </MapPopup>
        )}
      </Map>
    </div>
  );
}