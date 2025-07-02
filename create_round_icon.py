#!/usr/bin/env python3
"""
Cheiron アプリ用の丸いアイコンを作成するスクリプト
PIL (Pillow) が必要: pip install Pillow
"""

from PIL import Image, ImageDraw
import os

def create_round_icon(input_path, output_path, size=256):
    """
    四角いアイコンを丸いアイコンに変換
    """
    # 元画像を開く
    img = Image.open(input_path).convert("RGBA")
    
    # 指定サイズにリサイズ
    img = img.resize((size, size), Image.LANCZOS)
    
    # 透明な画像を作成
    mask = Image.new('L', (size, size), 0)
    draw = ImageDraw.Draw(mask)
    
    # 円形マスクを描画
    draw.ellipse((0, 0, size, size), fill=255)
    
    # マスクを適用
    output = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    output.paste(img, (0, 0))
    output.putalpha(mask)
    
    # 保存
    output.save(output_path, 'PNG')
    print(f"丸いアイコンを作成しました: {output_path}")

if __name__ == "__main__":
    # パス設定
    script_dir = os.path.dirname(os.path.abspath(__file__))
    public_dir = os.path.join(script_dir, "public")
    
    input_file = os.path.join(public_dir, "Cheiron_256x256.png")
    output_file = os.path.join(public_dir, "Cheiron_256x256_round.png")
    
    if os.path.exists(input_file):
        create_round_icon(input_file, output_file, 256)
        
        # 64x64版も作成
        output_64 = os.path.join(public_dir, "Cheiron_64x64_round.png")
        create_round_icon(input_file, output_64, 64)
        
        print("\n使用方法:")
        print("electron.js で以下のように変更してください:")
        print(f"icon: path.join(__dirname, 'Cheiron_256x256_round.png')")
    else:
        print(f"入力ファイルが見つかりません: {input_file}")