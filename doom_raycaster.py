"""
DOOM-style Raycasting Game in Python

Controls:
W/S        - Move forward/backward
A/D        - Rotate left/right
ESC        - Quit

Requirements: pip install pygame
"""

import pygame
import math
import sys

# ── Constants ──────────────────────────────────────────────────────────────────

WIDTH, HEIGHT = 800, 600
HALF_HEIGHT   = HEIGHT // 2
FOV           = math.pi / 3          # 60°
HALF_FOV      = FOV / 2
NUM_RAYS      = WIDTH // 2           # one ray per 2 pixels → speed
MAX_DEPTH     = 800
DELTA_ANGLE   = FOV / NUM_RAYS
SCREEN_DIST   = (WIDTH // 2) / math.tan(HALF_FOV)
SCALE         = WIDTH // NUM_RAYS    # width of each vertical stripe
PLAYER_SPEED  = 3
PLAYER_ROT    = 0.03
MINIMAP_SCALE = 8
MINIMAP_X     = 10
MINIMAP_Y     = 10

# Colours

BLACK  = (0,   0,   0)
WHITE  = (255, 255, 255)
RED    = (200,  30,  30)
GREEN  = ( 30, 200,  30)
BLUE   = ( 30,  30, 200)
YELLOW = (220, 200,  20)
GREY   = ( 90,  90,  90)
DARK   = ( 40,  40,  40)
SKY    = ( 20,  20,  60)
FLOOR  = ( 50,  50,  50)

# Wall colour palette (each map value → colour)

WALL_COLOURS = {
    1: (180, 40,  40),   # red brick
    2: ( 40, 40, 180),   # blue stone
    3: ( 40, 180, 40),   # green moss
    4: (180, 160, 40),   # yellow
    5: (140,  80, 40),   # brown
}

# ── Map ────────────────────────────────────────────────────────────────────────

MAP = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,2,2,2,0,0,3,0,0,0,0,0,1],
    [1,0,0,0,2,0,0,0,0,3,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,3,3,3,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,5,5,0,0,0,0,0,0,0,4,4,0,1],
    [1,0,0,5,0,0,0,0,0,0,0,0,4,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,4,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,1,1,1,1,0,0,0,0,0,1],
    [1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
]
MAP_WIDTH  = len(MAP[0])
MAP_HEIGHT = len(MAP)
TILE       = 64  # world units per tile

def map_is_wall(x, y):
    """Return wall value (>0) or 0 if open / out of bounds."""
    mx, my = int(x // TILE), int(y // TILE)
    if 0 <= mx < MAP_WIDTH and 0 <= my < MAP_HEIGHT:
        return MAP[my][mx]
    return 1

# ── Player ─────────────────────────────────────────────────────────────────────

class Player:
    def __init__(self):
        self.x     = TILE * 1.5
        self.y     = TILE * 1.5
        self.angle = 0.0

    def move(self, keys):
        sin_a = math.sin(self.angle)
        cos_a = math.cos(self.angle)

        dx, dy = 0, 0
        if keys[pygame.K_w]:
            dx += cos_a * PLAYER_SPEED
            dy += sin_a * PLAYER_SPEED
        if keys[pygame.K_s]:
            dx -= cos_a * PLAYER_SPEED
            dy -= sin_a * PLAYER_SPEED
        if keys[pygame.K_a]:
            self.angle -= PLAYER_ROT
        if keys[pygame.K_d]:
            self.angle += PLAYER_ROT

        # Collision (slide along walls)
        margin = 20
        if not map_is_wall(self.x + dx + math.copysign(margin, dx), self.y):
            self.x += dx
        if not map_is_wall(self.x, self.y + dy + math.copysign(margin, dy)):
            self.y += dy

        self.angle %= 2 * math.pi

# ── Raycaster ──────────────────────────────────────────────────────────────────

def cast_rays(player):
    """Return list of (wall_dist, wall_value, ray_x) for each ray."""
    results = []
    ray_angle = player.angle - HALF_FOV

    for ray in range(NUM_RAYS):
        sin_a = math.sin(ray_angle)
        cos_a = math.cos(ray_angle)

        # DDA algorithm ──────────────────────────────────────────────
        # Horizontal intersections
        if sin_a:
            y_h   = (int(player.y // TILE) + (1 if sin_a > 0 else 0)) * TILE
            x_h   = player.x + (y_h - player.y) / sin_a * cos_a
            dy_h  = TILE if sin_a > 0 else -TILE
            dx_h  = dy_h / sin_a * cos_a
            dist_h = MAX_DEPTH
            wall_h = 0
            for _ in range(MAX_DEPTH // TILE):
                mx, my = int(x_h // TILE), int(y_h // TILE) - (0 if sin_a > 0 else 1)
                if 0 <= mx < MAP_WIDTH and 0 <= my < MAP_HEIGHT and MAP[my][mx]:
                    dist_h = math.hypot(x_h - player.x, y_h - player.y)
                    wall_h = MAP[my][mx]
                    break
                x_h += dx_h
                y_h += dy_h
        else:
            dist_h = MAX_DEPTH
            wall_h = 0

        # Vertical intersections
        if cos_a:
            x_v   = (int(player.x // TILE) + (1 if cos_a > 0 else 0)) * TILE
            y_v   = player.y + (x_v - player.x) / cos_a * sin_a
            dx_v  = TILE if cos_a > 0 else -TILE
            dy_v  = dx_v / cos_a * sin_a
            dist_v = MAX_DEPTH
            wall_v = 0
            for _ in range(MAX_DEPTH // TILE):
                mx, my = int(x_v // TILE) - (0 if cos_a > 0 else 1), int(y_v // TILE)
                if 0 <= mx < MAP_WIDTH and 0 <= my < MAP_HEIGHT and MAP[my][mx]:
                    dist_v = math.hypot(x_v - player.x, y_v - player.y)
                    wall_v = MAP[my][mx]
                    break
                x_v += dx_v
                y_v += dy_v
        else:
            dist_v = MAX_DEPTH
            wall_v = 0

        # Pick closest hit
        if dist_h < dist_v:
            dist, wall = dist_h, wall_h
            shade = 1.0   # horizontal faces slightly darker
        else:
            dist, wall = dist_v, wall_v
            shade = 0.75

        # Fish-eye correction
        dist *= math.cos(player.angle - ray_angle)
        results.append((max(dist, 1), wall, shade))
        ray_angle += DELTA_ANGLE

    return results

# ── Renderer ───────────────────────────────────────────────────────────────────

def render_3d(surface, results):
    """Draw sky, floor, and walls."""
    # Sky
    surface.fill(SKY, (0, 0, WIDTH, HALF_HEIGHT))
    # Floor
    surface.fill(FLOOR, (0, HALF_HEIGHT, WIDTH, HALF_HEIGHT))

    for ray, (dist, wall, shade) in enumerate(results):
        proj_height = int(SCREEN_DIST * TILE / dist)
        top    = HALF_HEIGHT - proj_height // 2
        bottom = top + proj_height

        # Base colour
        base = WALL_COLOURS.get(wall, (160, 160, 160))

        # Distance fog
        fog = min(dist / MAX_DEPTH, 1.0)
        brightness = (1 - fog) * shade

        colour = tuple(int(c * brightness) for c in base)

        x = ray * SCALE
        pygame.draw.rect(surface, colour, (x, top, SCALE, proj_height))

def render_minimap(surface, player):
    """Tiny top-left overhead map."""
    s = MINIMAP_SCALE
    for my in range(MAP_HEIGHT):
        for mx in range(MAP_WIDTH):
            val = MAP[my][mx]
            colour = DARK if not val else WALL_COLOURS.get(val, WHITE)
            pygame.draw.rect(
                surface, colour,
                (MINIMAP_X + mx * s, MINIMAP_Y + my * s, s - 1, s - 1)
            )
    # Player dot
    px = MINIMAP_X + int(player.x / TILE * s)
    py = MINIMAP_Y + int(player.y / TILE * s)
    pygame.draw.circle(surface, YELLOW, (px, py), 3)

    # Direction line
    dx = int(math.cos(player.angle) * 8)
    dy = int(math.sin(player.angle) * 8)
    pygame.draw.line(surface, YELLOW, (px, py), (px + dx, py + dy), 2)

def render_hud(surface, font, fps):
    """Crosshair + FPS."""
    cx, cy = WIDTH // 2, HEIGHT // 2
    pygame.draw.line(surface, WHITE, (cx - 10, cy), (cx + 10, cy), 2)
    pygame.draw.line(surface, WHITE, (cx, cy - 10), (cx, cy + 10), 2)

    fps_text = font.render(f"FPS: {fps:.0f}", True, GREEN)
    surface.blit(fps_text, (WIDTH - 100, 10))

    hint = font.render("W/S Move  A/D Turn  ESC Quit", True, GREY)
    surface.blit(hint, (WIDTH // 2 - hint.get_width() // 2, HEIGHT - 28))

# ── Main ───────────────────────────────────────────────────────────────────────

def main():
    pygame.init()
    screen = pygame.display.set_mode((WIDTH, HEIGHT))
    pygame.display.set_caption("DOOM-style Raycaster — Python")
    clock  = pygame.time.Clock()
    font   = pygame.font.SysFont("consolas", 18)

    player = Player()

    running = True
    while running:
        # Events
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            if event.type == pygame.KEYDOWN and event.key == pygame.K_ESCAPE:
                running = False

        keys = pygame.key.get_pressed()
        player.move(keys)

        # Cast rays & render
        rays = cast_rays(player)
        render_3d(screen, rays)
        render_minimap(screen, player)

        fps = clock.get_fps()
        render_hud(screen, font, fps)

        pygame.display.flip()
        clock.tick(60)

    pygame.quit()
    sys.exit()

if __name__ == "__main__":
    main()
