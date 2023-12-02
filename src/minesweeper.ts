import { times, range } from "lodash/fp"

export type Position = {
  x: number
  y: number
}

export type Tile = Position & {
  status: (typeof TILE_STATUSES)[keyof typeof TILE_STATUSES]
  mine: boolean
  adjacentMinesCount?: number
}

export const TILE_STATUSES = {
  HIDDEN: "hidden",
  MINE: "mine",
  NUMBER: "number",
  MARKED: "marked",
} as const;


export function createBoard(boardSize: number, minePositions: Position[]) {
  return times(x => {
    return times(y => {
      const tile: Tile = {
        x,
        y,
        mine: minePositions.some(positionMatch.bind(null, { x, y })),
        status: TILE_STATUSES.HIDDEN,
      };

      return tile;
    }, boardSize)
  }, boardSize)
}

export function markedTilesCount(board: Tile[][]) {
  return board.reduce((count, row) => {
    return (
      count + row.filter(tile => tile.status === TILE_STATUSES.MARKED).length
    )
  }, 0)
}

export function markTile(board: Tile[][], { x, y }: Position) {
  const tile = board[x][y]
  if (
    tile.status !== TILE_STATUSES.HIDDEN &&
    tile.status !== TILE_STATUSES.MARKED
  ) {
    return board
  }

  if (tile.status === TILE_STATUSES.MARKED) {
    return replaceTile(
      board,
      { x, y },
      { ...tile, status: TILE_STATUSES.HIDDEN }
    )
  } else {
    return replaceTile(
      board,
      { x, y },
      { ...tile, status: TILE_STATUSES.MARKED }
    )
  }
}

function replaceTile(board: Tile[][], position: Position, newTile: Tile) {
  return board.map((row, x) => {
    return row.map((tile, y) => {
      if (positionMatch(position, { x, y })) {
        return newTile
      }
      return tile
    })
  })
}

export function revealTile(board: Tile[][], { x, y }: Position): Tile[][] {
  const tile = board[x][y]
  if (tile.status !== TILE_STATUSES.HIDDEN) {
    return board
  }

  if (tile.mine) {
    return replaceTile(board, { x, y }, { ...tile, status: TILE_STATUSES.MINE })
  }

  const adjacentTiles = nearbyTiles(board, tile)
  const mines = adjacentTiles.filter(t => t.mine)
  const newBoard = replaceTile(
    board,
    { x, y },
    { ...tile, status: TILE_STATUSES.NUMBER, adjacentMinesCount: mines.length }
  )
  if (mines.length === 0) {
    return adjacentTiles.reduce((b, t) => {
      return revealTile(b, t);
    }, newBoard)
  }

  return newBoard;
}

export function checkWin(board: Tile[][]) {
  return board.every(row => {
    return row.every(tile => {
      return (
        tile.status === TILE_STATUSES.NUMBER ||
        (tile.mine &&
          (tile.status === TILE_STATUSES.HIDDEN ||
            tile.status === TILE_STATUSES.MARKED))
      )
    })
  })
}

export function checkLose(board: Tile[][]) {
  return board.some(row => {
    return row.some(tile => {
      return tile.status === TILE_STATUSES.MINE
    })
  })
}

export function positionMatch(a: Position, b: Position) {
  return a.x === b.x && a.y === b.y
}

function nearbyTiles(board: Tile[][], { x, y }: Position) {
  const offsets = range(-1, 2)

  return offsets.flatMap(xOffset => {
      return offsets.map(yOffset => {
        return board[x + xOffset]?.[y + yOffset]
      })
    })
    .filter(tile => tile != null)
}
