import os
from pydub import AudioSegment

def combine_music_parts(input_folder, output_file):
    # Define the order and loop counts for each part
    sequence = [
        ("Dragons don't like tetris p1.wav", 1),
        ("Dragons don't like tetris p2.wav", 20),
        ("Dragons don't like tetris p3.wav", 10),
        ("Dragons don't like tetris p4.wav", 10),
        ("Dragons don't like tetris p5.wav", 1),
        ("Dragons don't like tetris p6.wav", 1),
        ("Dragons don't like tetris p7.wav", 1)
    ]
    combined = None
    for filename, count in sequence:
        path = os.path.join(input_folder, filename)
        if not os.path.exists(path):
            raise Exception(f"Missing file: {filename}")
        audio = AudioSegment.from_file(path)
        for _ in range(count):
            if combined is None:
                combined = audio
            else:
                combined += audio
    combined.export(output_file, format=output_file.split('.')[-1])
    print(f'Created 1hr version as {output_file}')

if __name__ == '__main__':
    input_folder = 'music'  # Folder containing music files
    output_file = 'combined_music_1hr.mp3'  # Output file name
    combine_music_parts(input_folder, output_file)
    print('Download the result from your workspace.')
