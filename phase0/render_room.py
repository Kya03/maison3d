# Phase 0 : rendu photoréaliste d'une pièce (chambre 1 du rez-de-chaussée) avec Blender / Cycles, sans interface.
#   blender -b -P render_room.py
# Variables facultatives : QUALITE=rapide|moyenne|haute   EXPOSITION=0.8   SORTIE=chambre1.png
import bpy, bmesh, math, os
from mathutils import Vector

Q = os.environ.get('QUALITE', 'moyenne')
RES, SAMPLES = {'rapide': ((960, 540), 32), 'moyenne': ((1280, 720), 96), 'haute': ((1920, 1080), 256)}[Q]
EXPO = float(os.environ.get('EXPOSITION', '0.8'))
OUT = os.path.abspath(os.environ.get('SORTIE', 'chambre1.png'))

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene

# ---------- matériaux ----------
def rgb(h):
    h = h.lstrip('#')
    return tuple(pow(int(h[i:i + 2], 16) / 255, 2.2) for i in (0, 2, 4)) + (1,)

_m = {}
def mat(color, rough=0.75, metal=0.0, emit=0.0):
    k = (color, rough, metal, emit)
    if k not in _m:
        m = bpy.data.materials.new('m'); m.use_nodes = True
        b = m.node_tree.nodes['Principled BSDF']
        b.inputs['Base Color'].default_value = rgb(color)
        b.inputs['Roughness'].default_value = rough
        b.inputs['Metallic'].default_value = metal
        if emit:
            for n in ('Emission Color', 'Emission'):
                if n in b.inputs:
                    b.inputs[n].default_value = rgb(color); break
            b.inputs['Emission Strength'].default_value = emit
        _m[k] = m
    return _m[k]

def smart(color):  # choisit la matière selon la couleur
    if color == '#c9a45c': return mat(color, 0.25, 1.0)          # laiton
    if color == '#ffd89a': return mat(color, 0.5, 0, 6.0)        # LED chaude
    if color == '#dfeaee': return mat(color, 0.03, 1.0)          # miroir
    if color in ('#b99a74', '#8b6a4a', '#4d3626'): return mat(color, 0.4)  # bois
    return mat(color, 0.85)                                     # tissu / peinture

def wood_floor():
    m = bpy.data.materials.new('floor'); m.use_nodes = True
    nt = m.node_tree; b = nt.nodes['Principled BSDF']; b.inputs['Roughness'].default_value = 0.35
    b.inputs['Base Color'].default_value = rgb('#c8ad86')
    try:
        tc = nt.nodes.new('ShaderNodeTexCoord'); br = nt.nodes.new('ShaderNodeTexBrick')
        br.inputs['Color1'].default_value = rgb('#c9ae88'); br.inputs['Color2'].default_value = rgb('#b99a74')
        br.inputs['Mortar'].default_value = rgb('#4a3826'); br.inputs['Scale'].default_value = 2.7
        br.inputs['Mortar Size'].default_value = 0.004; br.inputs['Brick Width'].default_value = 6.0; br.inputs['Row Height'].default_value = 0.5
        nt.links.new(tc.outputs['Object'], br.inputs['Vector']); nt.links.new(br.outputs['Color'], b.inputs['Base Color'])
    except Exception as e:
        print('parquet simple :', e)
    return m

# ---------- géométrie : repère Blender X = x du plan, Y = -z du plan, Z = hauteur ----------
def box(cx, cy, cz, sx, sy, sz, m, bevel=0.008):
    hx, hy, hz = sx / 2, sy / 2, sz / 2
    v = [(cx + a * hx, cy + b * hy, cz + c * hz) for a in (-1, 1) for b in (-1, 1) for c in (-1, 1)]
    f = [(0, 1, 3, 2), (4, 6, 7, 5), (0, 4, 5, 1), (2, 3, 7, 6), (0, 2, 6, 4), (1, 5, 7, 3)]
    me = bpy.data.meshes.new('b'); me.from_pydata(v, [], f); me.update()
    bm = bmesh.new(); bm.from_mesh(me); bmesh.ops.recalc_face_normals(bm, faces=bm.faces); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new('b', me); bpy.context.collection.objects.link(o); o.data.materials.append(m)
    if bevel > 0 and min(sx, sy, sz) > bevel * 3:
        md = o.modifiers.new('bv', 'BEVEL'); md.width = bevel; md.segments = 2
    return o

def pbox(x, z, h0, h1, sx, sz, m, bevel=0.008):  # x, z = repère du plan
    return box(x, -z, (h0 + h1) / 2, sx, sz, h1 - h0, m, bevel)

H, T = 3.0, 0.15
X0, X1, Z0, Z1 = 4.15, 8.15, 16.85, 21.85   # intérieur de la chambre 1 (plan)
paint, ceil = mat('#e9dfd0', 0.9), mat('#f4f1ea', 0.9)
door_m, frame_m = mat('#b99a74', 0.4), mat('#f4efe6', 0.5)

def wall(axis, line, a0, a1, ops):  # axis 'x' : mur le long de x ; 'z' : le long de z. ops = (centre, largeur, seuil, hauteur)
    cur, parts = a0, []
    for c, w, sill, h in sorted(ops):
        a, b = c - w / 2, c + w / 2
        if a > cur: parts.append((cur, a, 0, H))
        if sill > 0: parts.append((a, b, 0, sill))
        if sill + h < H: parts.append((a, b, sill + h, H))
        cur = b
    if a1 > cur: parts.append((cur, a1, 0, H))
    for a, b, y0, y1 in parts:
        if axis == 'x': pbox((a + b) / 2, line, y0, y1, b - a, T, paint)
        else: pbox(line, (a + b) / 2, y0, y1, T, b - a, paint)

# murs, plafond, sol
wall('x', Z0 - T / 2, X0 - T, X1 + T, [(7.6, 0.9, 0, 2.1), (5.2, 0.8, 0, 2.1)])      # nord : 2 portes
wall('x', Z1 + T / 2, X0 - T, X1 + T, [(6.15, 1.5, 0.9, 1.2)])                         # sud : fenêtre
wall('z', X0 - T / 2, Z0, Z1, []); wall('z', X1 + T / 2, Z0, Z1, [])                  # ouest (tête de lit), est
pbox((X0 + X1) / 2, (Z0 + Z1) / 2, H, H + 0.15, X1 - X0 + 2 * T, Z1 - Z0 + 2 * T, ceil)
fl = box((X0 + X1) / 2, -(Z0 + Z1) / 2, -0.03, X1 - X0, Z1 - Z0, 0.06, wood_floor(), 0)
for c, w in ((7.6, 0.9), (5.2, 0.8)):                                                  # portes fermées
    pbox(c, Z0 - T / 2, 0, 2.1, w - 0.02, 0.04, door_m)
for dx in (-0.78, 0.78):                                                                # cadre de fenêtre
    pbox(6.15 + dx, Z1 + T / 2, 0.9, 2.1, 0.04, 0.08, frame_m)
pbox(6.15, Z1 + T / 2, 0.88, 0.92, 1.58, 0.08, frame_m); pbox(6.15, Z1 + T / 2, 2.08, 2.12, 1.58, 0.08, frame_m)

# ---------- mobilier (mêmes cotes que l'application) : (dx, dy, dz, sx, sy, sz, couleur) ----------
IV = {'wall': '#e9dfd0', 'head': '#f1ebe0', 'bed': '#f4efe6', 'throw': '#cbb79b', 'accent': '#d9c7a3', 'rug': '#eee6d8', 'wood': '#b99a74', 'curtain': '#d8cbb6'}
G, L, O = '#c9a45c', '#ffd89a', '#f4efe6'
BED = [(0, .22, 0, 1.7, .44, 2.1, '$head'), (0, .55, .05, 1.55, .22, 1.95, '$bed'), (0, .95, -1.03, 1.9, 1.2, .08, '$head'), (-.5, .95, -.98, .55, .75, .06, '$head'), (0, .95, -.98, .55, .75, .06, '$head'), (.5, .95, -.98, .55, .75, .06, '$head'),
       (-.4, .72, -.72, .55, .14, .32, '$accent'), (.4, .72, -.72, .55, .14, .32, '$accent'), (0, .76, -.5, .9, .1, .3, '$throw'), (0, .68, .55, 1.56, .04, .85, '$throw'),
       (-1.15, .28, -.85, .5, .56, .42, '$wood'), (1.15, .28, -.85, .5, .56, .42, '$wood'), (-1.15, .68, -.85, .14, .22, .14, O), (1.15, .68, -.85, .14, .22, .14, O), (-1.15, 1.6, -1.0, .1, .4, .08, G), (1.15, 1.6, -1.0, .1, .4, .08, G)]
VANITY = [(0, .38, 0, 1.4, .76, .5, O), (0, .78, 0, 1.46, .04, .52, O), (0, 1.55, -.23, 1.0, 1.0, .02, L), (0, 1.55, -.22, .9, .9, .03, '#dfeaee'), (0, .28, .65, .55, .56, .5, '$head'), (0, .62, .9, .55, .5, .1, '$head'), (-.5, .9, 0, .12, .25, .12, '#e8d9c0')]
MIROIR = [(0, .9, 0, .7, 1.8, .08, '#f1ebe0'), (0, .9, .045, .55, 1.6, .02, '#dfeaee'), (0, .9, -.03, .78, 1.88, .02, L)]
PLANT = [(0, .2, 0, .3, .4, .3, '#c4704f'), (0, .8, 0, .5, .8, .5, '#5b7f4a')]
RUG = [(0, .012, 0, 2.4, .02, 1.6, '$rug')]

def tr(x, z, th, dx, dz):
    return x + dx * math.cos(th) + dz * math.sin(th), z - dx * math.sin(th) + dz * math.cos(th)

def place(parts, x, z, th):
    for dx, dy, dz, sx, sy, sz, col in parts:
        wx, wz = tr(x, z, th, dx, dz)
        if abs(math.sin(th)) > 0.5: sx, sz = sz, sx
        c = IV.get(col[1:], '#cccccc') if col.startswith('$') else col
        box(wx, -wz, dy, sx, sz, sy, smart(c), 0.006)

cx, cz, H2 = (X0 + X1) / 2, (Z0 + Z1) / 2, math.pi / 2
place(RUG, cx, cz, 0); place(BED, X0 + 1.15, cz, H2)                    # lit, tête contre le mur ouest
place(VANITY, X1 - 0.3, 18.3, -H2); place(MIROIR, X1 - 0.3, 20.8, -H2); place(PLANT, X1 - 0.35, Z1 - 0.35, 0)
pbox(6.15, Z1 - 0.14, 0.1, 2.7, 2.0, 0.05, mat(IV['curtain'], 0.95))      # rideau
pbox(4.6, Z1 - 0.14, 0.1, 2.7, 0.5, 0.06, mat(IV['curtain'], 0.95))

# ---------- extérieur ----------
box(8.5, 11.5, -0.1, 80, 80, 0.2, mat('#cdbf9f', 0.95), 0)                # sol
pbox(8.5, 22.95, 0, 2.2, 17, 0.2, mat('#e3d8c6', 0.9))                     # clôture côté rue

# ---------- lumières ----------
def light(kind, loc, energy, color=(1, 1, 1), size=0.1, rot=(0, 0, 0)):
    ld = bpy.data.lights.new('l', kind); ld.energy = energy; ld.color = color
    if kind == 'AREA': ld.size = size[0]; ld.size_y = size[1]
    elif kind == 'POINT': ld.shadow_soft_size = size
    o = bpy.data.objects.new('l', ld); o.location = loc; o.rotation_euler = rot; bpy.context.collection.objects.link(o); return o

sun = light('SUN', (0, 0, 10), 3.5); sun.data.angle = 0.02
sun.rotation_euler = Vector((-0.5, 0.6, -0.7)).to_track_quat('-Z', 'Y').to_euler()
light('AREA', (6.15, -(Z1 + 0.45), 1.5), 600, (0.88, 0.94, 1.0), (1.5, 1.2), (math.radians(90), 0, 0))   # lumière du jour par la fenêtre
for s in (-1.15, 1.15):                                                    # appliques de chevet
    wx, wz = tr(X0 + 1.15, cz, H2, s, -0.95); light('POINT', (wx, -wz, 1.55), 35, (1, 0.78, 0.55), 0.06)
light('POINT', (cx, -cz, 2.85), 60, (1, 0.84, 0.66), 0.15)                 # plafonnier

# ciel
w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True
bg = w.node_tree.nodes['Background']
try:
    sky = w.node_tree.nodes.new('ShaderNodeTexSky'); sky.sky_type = 'NISHITA'; sky.sun_elevation = math.radians(45)
    try: sky.sun_disc = False
    except Exception: pass
    w.node_tree.links.new(sky.outputs['Color'], bg.inputs['Color']); bg.inputs['Strength'].default_value = 1.0
except Exception as e:
    print('ciel simple :', e); bg.inputs['Color'].default_value = (0.55, 0.7, 0.95, 1)

# ---------- caméra ----------
cam = bpy.data.cameras.new('c'); cam.lens = 20
co = bpy.data.objects.new('c', cam); bpy.context.collection.objects.link(co)
co.location = (X1 - 0.35, -(Z0 + 0.5), 1.45)
co.rotation_euler = (Vector((4.9, -20.2, 1.0)) - co.location).to_track_quat('-Z', 'Y').to_euler()
sc.camera = co

# ---------- rendu ----------
sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = SAMPLES; sc.cycles.use_denoising = True
try: sc.cycles.denoiser = 'OPENIMAGEDENOISE'
except Exception: pass
sc.cycles.max_bounces = 8
sc.render.resolution_x, sc.render.resolution_y = RES; sc.render.resolution_percentage = 100
try: sc.view_settings.view_transform = 'AgX'
except Exception: sc.view_settings.view_transform = 'Filmic'
sc.view_settings.exposure = EXPO
sc.render.image_settings.file_format = 'PNG'; sc.render.filepath = OUT
bpy.ops.wm.save_as_mainfile(filepath=os.path.splitext(OUT)[0] + '.blend')   # ouvrable plus tard dans Blender
bpy.ops.render.render(write_still=True)
print('Image écrite :', OUT)
