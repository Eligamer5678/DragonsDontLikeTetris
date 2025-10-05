import os
from pydub import AudioSegment

def combine_music_files(input_folder, output_file):
    # Get all audio files in the folder (supports .mp3, .wav, .ogg)
    files = [f for f in os.listdir(input_folder) if f.lower().endswith(('.mp3', '.wav', '.ogg'))]
    if not files:
        raise Exception('No audio files found in the folder.')
    files.sort()  # Sort alphabetically
    combined = None
    for filename in files:
        path = os.path.join(input_folder, filename)
        audio = AudioSegment.from_file(path)
        if combined is None:
            combined = audio
        else:
            combined += audio
    combined.export(output_file, format=output_file.split('.')[-1])
    print(f'Combined {len(files)} files into {output_file}')

if __name__ == '__main__':
    # Change these paths as needed
    input_folder = 'music'  # Folder containing music files
    output_file = 'combined_music.mp3'  # Output file name
    combine_music_files(input_folder, output_file)
    print('Download the result from your workspace.')
