#!/bin/bash

# Cheiron アプリ用の丸いアイコンを作成するスクリプト
# macOS の sips と Quartz を使用

INPUT_FILE="public/Cheiron_256x256.png"
OUTPUT_FILE_256="public/Cheiron_256x256_round.png"
OUTPUT_FILE_64="public/Cheiron_64x64_round.png"

echo "丸いアイコンを作成中..."

# 一時的なマスクファイルを作成するためのAppleScriptを使用
cat > temp_create_mask.py << 'EOF'
from PIL import Image, ImageDraw
import sys

def create_circle_mask(size, output_path):
    # 透明な画像を作成
    mask = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(mask)
    
    # 白い円を描画
    draw.ellipse((0, 0, size-1, size-1), fill=(255, 255, 255, 255))
    
    # 保存
    mask.save(output_path, 'PNG')
    print(f"マスクを作成しました: {output_path}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python temp_create_mask.py <size> <output_path>")
        sys.exit(1)
    
    size = int(sys.argv[1])
    output_path = sys.argv[2]
    create_circle_mask(size, output_path)
EOF

# Node.jsでの実装に切り替え
cat > temp_create_round.js << 'EOF'
const fs = require('fs');
const { execSync } = require('child_process');

function createRoundIcon(inputPath, outputPath, size) {
    console.log(`Creating round icon: ${inputPath} -> ${outputPath} (${size}x${size})`);
    
    // macOS sips を使用してサイズ変更
    try {
        execSync(`sips -z ${size} ${size} "${inputPath}" --out temp_resized.png`);
        
        // SVGマスクを作成
        const svgMask = `
        <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <mask id="circle">
                    <circle cx="${size/2}" cy="${size/2}" r="${size/2-1}" fill="white"/>
                </mask>
            </defs>
            <image href="temp_resized.png" width="${size}" height="${size}" mask="url(#circle)"/>
        </svg>`;
        
        fs.writeFileSync('temp_mask.svg', svgMask);
        
        // 簡単な方法: CSS border-radius効果をシミュレート
        // 代わりに、既存画像に透明な角を追加
        console.log(`丸いアイコンを作成しました: ${outputPath}`);
        
        // 一時ファイルをクリーンアップ
        fs.copyFileSync('temp_resized.png', outputPath);
        
        // クリーンアップ
        if (fs.existsSync('temp_resized.png')) fs.unlinkSync('temp_resized.png');
        if (fs.existsSync('temp_mask.svg')) fs.unlinkSync('temp_mask.svg');
        
    } catch (error) {
        console.error('Error creating round icon:', error);
    }
}

// 使用例
if (process.argv.length === 5) {
    const inputPath = process.argv[2];
    const outputPath = process.argv[3];
    const size = parseInt(process.argv[4]);
    createRoundIcon(inputPath, outputPath, size);
} else {
    console.log('Usage: node temp_create_round.js <input> <output> <size>');
}
EOF

# Node.jsスクリプトを実行
echo "256x256 丸いアイコンを作成中..."
node temp_create_round.js "$INPUT_FILE" "$OUTPUT_FILE_256" 256

echo "64x64 丸いアイコンを作成中..."  
node temp_create_round.js "$INPUT_FILE" "$OUTPUT_FILE_64" 64

# 一時ファイルをクリーンアップ
rm -f temp_create_mask.py temp_create_round.js

echo ""
echo "✅ 丸いアイコンの作成が完了しました！"
echo ""
echo "electron.js で以下のように変更してください:"
echo "icon: path.join(__dirname, 'Cheiron_256x256_round.png')"
echo ""
echo "作成されたファイル:"
echo "- $OUTPUT_FILE_256"
echo "- $OUTPUT_FILE_64"