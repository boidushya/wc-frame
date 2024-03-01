import QRCodeUtil from "qrcode";

type CoordinateMapping = [number, number[]];

const CONNECTING_ERROR_MARGIN = 0.1;
const CIRCLE_SIZE_MODIFIER = 2.5;
const QRCODE_MATRIX_MARGIN = 7;

function isAdjecentDots(cy: number, otherCy: number, cellSize: number) {
  if (cy === otherCy) {
    return false;
  }
  const diff = cy - otherCy < 0 ? otherCy - cy : cy - otherCy;

  return diff <= cellSize + CONNECTING_ERROR_MARGIN;
}

function getMatrix(
  value: string,
  errorCorrectionLevel: QRCodeUtil.QRCodeErrorCorrectionLevel
) {
  const arr = Array.prototype.slice.call(
    QRCodeUtil.create(value, { errorCorrectionLevel }).modules.data,
    0
  );
  const sqrt = Math.sqrt(arr.length);

  return arr.reduce(
    (rows, key, index) =>
      (index % sqrt === 0
        ? rows.push([key])
        : rows[rows.length - 1].push(key)) && rows,
    []
  );
}

const QrCodeUtil = {
  generate(uri: string, size: number, logoSize: number) {
    const dotColor = "#000";
    const edgeColor = "transparent";
    const strokeWidth = 6.5;
    const dots: JSX.Element[] = [];
    const matrix = getMatrix(uri, "Q");
    const cellSize = size / matrix.length;
    const qrList = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
    ];

    qrList.forEach(({ x, y }) => {
      const x1 = (matrix.length - QRCODE_MATRIX_MARGIN) * cellSize * x;
      const y1 = (matrix.length - QRCODE_MATRIX_MARGIN) * cellSize * y;
      const borderRadius = 0.4;
      for (let i = 0; i < qrList.length; i += 1) {
        const dotSize = cellSize * (QRCODE_MATRIX_MARGIN - i * 2);
        dots.push(
          <svg>
            <rect
              fill={i === 2 ? dotColor : edgeColor}
              width={i === 0 ? dotSize - strokeWidth : dotSize}
              rx={
                i === 0
                  ? (dotSize - strokeWidth) * borderRadius
                  : dotSize * borderRadius
              }
              ry={
                i === 0
                  ? (dotSize - strokeWidth) * borderRadius
                  : dotSize * borderRadius
              }
              stroke={dotColor}
              stroke-width={i === 0 ? strokeWidth : 0}
              height={i === 0 ? dotSize - strokeWidth : dotSize}
              x={
                i === 0
                  ? y1 + cellSize * i + strokeWidth / 2
                  : y1 + cellSize * i
              }
              y={
                i === 0
                  ? x1 + cellSize * i + strokeWidth / 2
                  : x1 + cellSize * i
              }
            ></rect>
          </svg>
        );
      }
    });

    const clearArenaSize = Math.floor((logoSize + 25) / cellSize);
    const matrixMiddleStart = matrix.length / 2 - clearArenaSize / 2;
    const matrixMiddleEnd = matrix.length / 2 + clearArenaSize / 2 - 1;
    const circles: [number, number][] = [];

    // Getting coordinates for each of the QR code dots
    matrix.forEach((row: QRCodeUtil.QRCode[], i: number) => {
      row.forEach((_, j: number) => {
        if (matrix[i][j]) {
          if (
            !(
              (i < QRCODE_MATRIX_MARGIN && j < QRCODE_MATRIX_MARGIN) ||
              (i > matrix.length - (QRCODE_MATRIX_MARGIN + 1) &&
                j < QRCODE_MATRIX_MARGIN) ||
              (i < QRCODE_MATRIX_MARGIN &&
                j > matrix.length - (QRCODE_MATRIX_MARGIN + 1))
            )
          ) {
            if (
              !(
                i > matrixMiddleStart &&
                i < matrixMiddleEnd &&
                j > matrixMiddleStart &&
                j < matrixMiddleEnd
              )
            ) {
              const cx = i * cellSize + cellSize / 2;
              const cy = j * cellSize + cellSize / 2;
              circles.push([cx, cy]);
            }
          }
        }
      });
    });

    // Cx to multiple cys
    const circlesToConnect: Record<number, number[]> = {};

    // Mapping all dots cicles on the same x axis
    circles.forEach(([cx, cy]) => {
      if (circlesToConnect[cx]) {
        circlesToConnect[cx]?.push(cy);
      } else {
        circlesToConnect[cx] = [cy];
      }
    });

    // Drawing lonely dots
    Object.entries(circlesToConnect)
      // Only get dots that have neighbors
      .map(([cx, cys]) => {
        const newCys = cys.filter((cy) =>
          cys.every((otherCy) => !isAdjecentDots(cy, otherCy, cellSize))
        );

        return [Number(cx), newCys] as CoordinateMapping;
      })
      .forEach(([cx, cys]) => {
        cys.forEach((cy) => {
          dots.push(
            <svg>
              <circle
                cx={cx}
                cy={cy}
                fill={dotColor}
                r={cellSize / CIRCLE_SIZE_MODIFIER}
              ></circle>
            </svg>
          );
        });
      });

    // Drawing lines for dots that are close to each other
    Object.entries(circlesToConnect)
      // Only get dots that have more than one dot on the x axis
      .filter(([_, cys]) => cys.length > 1)
      // Removing dots with no neighbors
      .map(([cx, cys]) => {
        const newCys = cys.filter((cy) =>
          cys.some((otherCy) => isAdjecentDots(cy, otherCy, cellSize))
        );

        return [Number(cx), newCys] as CoordinateMapping;
      })
      // Get the coordinates of the first and last dot of a line
      .map(([cx, cys]) => {
        cys.sort((a, b) => (a < b ? -1 : 1));
        const groups: number[][] = [];

        for (const cy of cys) {
          const group = groups.find((item) =>
            item.some((otherCy) => isAdjecentDots(cy, otherCy, cellSize))
          );
          if (group) {
            group.push(cy);
          } else {
            groups.push([cy]);
          }
        }

        return [cx, groups.map((item) => [item[0], item[item.length - 1]])] as [
          number,
          number[][]
        ];
      })
      .forEach(([cx, groups]) => {
        groups.forEach(([y1, y2]) => {
          dots.push(
            <svg>
              <line
                x1={cx}
                x2={cx}
                y1={y1}
                y2={y2}
                stroke={dotColor}
                stroke-width={cellSize / (CIRCLE_SIZE_MODIFIER / 2)}
                stroke-linecap="round"
              ></line>
            </svg>
          );
        });
      });

    return dots;
  },
};

const QRCode = ({ uri, size }: { uri: string; size: number }) => {
  const qrCodeData = QrCodeUtil.generate(uri, size, 100);
  return (
    <div tw="bg-white p-4 flex rounded-3xl relative">
      <svg height={size} width={size}>
        {qrCodeData}
      </svg>
      <div
        style={{
          top: size / 2 - 30,
          left: size / 2 - 30,
          backgroundColor: "#3049CB",
        }}
        tw="absolute w-24 h-24 flex items-center justify-center p-4 rounded-3xl"
      >
        <svg
          role="img"
          viewBox="0 0 24 24"
          tw="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
          fill="white"
        >
          <path d="M4.913 7.519c3.915-3.831 10.26-3.831 14.174 0l.471.461a.483.483 0 0 1 0 .694l-1.611 1.577a.252.252 0 0 1-.354 0l-.649-.634c-2.73-2.673-7.157-2.673-9.887 0l-.694.68a.255.255 0 0 1-.355 0L4.397 8.719a.482.482 0 0 1 0-.693l.516-.507Zm17.506 3.263 1.434 1.404a.483.483 0 0 1 0 .694l-6.466 6.331a.508.508 0 0 1-.709 0l-4.588-4.493a.126.126 0 0 0-.178 0l-4.589 4.493a.508.508 0 0 1-.709 0L.147 12.88a.483.483 0 0 1 0-.694l1.434-1.404a.508.508 0 0 1 .709 0l4.589 4.493c.05.048.129.048.178 0l4.589-4.493a.508.508 0 0 1 .709 0l4.589 4.493c.05.048.128.048.178 0l4.589-4.493a.507.507 0 0 1 .708 0Z" />
        </svg>
      </div>
    </div>
  );
};

export default QRCode;
