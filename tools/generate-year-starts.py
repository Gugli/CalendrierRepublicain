"""Generate Republican year start dates from JPL DE440 autumn equinoxes (Paris rule)."""

from datetime import datetime, timedelta, timezone
from pathlib import Path

from skyfield import almanac
from skyfield.api import Loader

ROOT = Path(__file__).resolve().parent.parent
TOOLS_DIR = Path(__file__).resolve().parent
DATA_DIR = ROOT / "data"
BSP_PATH = TOOLS_DIR / "de440.bsp"
OUT_PATH = DATA_DIR / "republican-year-starts.js"

PARIS_OFFSET = timedelta(minutes=9, seconds=21)
FIRST_GREGORIAN_YEAR = 1792
YEAR_COUNT = 600


def load_ephemeris():
	TOOLS_DIR.mkdir(parents=True, exist_ok=True)
	if not BSP_PATH.exists():
		print(f"Downloading de440.bsp to {BSP_PATH}...")
	loader = Loader(str(TOOLS_DIR))
	eph = loader("de440.bsp")
	return eph, loader.timescale(), almanac.seasons(eph)


def autumn_equinox_paris_date(gregorian_year: int, ts, seasons) -> datetime.date:
	t0 = ts.utc(gregorian_year, 9, 1)
	t1 = ts.utc(gregorian_year, 9, 30)
	times, events = almanac.find_discrete(t0, t1, seasons)
	for ti, event in zip(times, events):
		if event == 2:  # Autumnal equinox
			utc = ti.utc_datetime().replace(tzinfo=timezone.utc)
			paris = utc + PARIS_OFFSET
			return paris.date()
	raise ValueError(f"No September equinox found for {gregorian_year}")


def main() -> None:
	eph, ts, seasons = load_ephemeris()

	starts = []
	for rep_year in range(1, YEAR_COUNT + 1):
		gregorian_year = FIRST_GREGORIAN_YEAR + rep_year - 1
		starts.append(autumn_equinox_paris_date(gregorian_year, ts, seasons).isoformat())

	# Validate known historical years (Wikipedia / decree)
	expected = {
		1: "1792-09-22",
		2: "1793-09-22",
		4: "1795-09-23",
		8: "1799-09-23",
		12: "1803-09-24",
		14: "1805-09-23",
	}
	for year, date in expected.items():
		if starts[year - 1] != date:
			print(f"Warning: An {year} got {starts[year - 1]}, expected {date}")

	lines = [
		"// 1 Vendémiaire for Republican years 1–600 (Gregorian equinox years 1792–2391).",
		"// Autumn equinox at Paris Observatory (UT1 + 9 min 21 s), JPL DE440 via Skyfield.",
		"const republicanYearStarts = [",
	]
	for i, date in enumerate(starts, start=1):
		lines.append(f'\t"{date}", // An {i}')
	lines.append("];")

	DATA_DIR.mkdir(parents=True, exist_ok=True)
	OUT_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")

	print(f"Wrote {len(starts)} entries to {OUT_PATH}")
	print(f"An 1: {starts[0]}, An 600: {starts[-1]}")


if __name__ == "__main__":
	main()
