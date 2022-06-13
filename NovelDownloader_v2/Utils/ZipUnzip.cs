/// ripped from
/// https://social.msdn.microsoft.com/Forums/en-US/08567b82-f3a3-4887-b6a7-92ae553e9e3f/compress-string-with-gzipstream?forum=winappswithcsharp

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NovelDownloader_v2.Utils
{
    public class ZipUnzip
    {
        public static byte[] Zip(string text)
        {
            byte[] buffer = Encoding.Unicode.GetBytes(text);
            MemoryStream ms = new MemoryStream();
            using (System.IO.Compression.GZipStream zip = new System.IO.Compression.GZipStream(ms, System.IO.Compression.CompressionMode.Compress, true))
            {
                zip.Write(buffer, 0, buffer.Length);
            }

            ms.Position = 0;
            byte[] compressed = new byte[ms.Length];
            ms.Read(compressed, 0, compressed.Length);
            byte[] gzBuffer = new byte[compressed.Length + 4];
            Buffer.BlockCopy(compressed, 0, gzBuffer, 4, compressed.Length);
            Buffer.BlockCopy(BitConverter.GetBytes(buffer.Length), 0, gzBuffer, 0, 4);
            return gzBuffer;
        }

        public static string UnZip(byte[] compressedBytes)
        {
            byte[] gzBuffer = compressedBytes;
            using (MemoryStream ms = new MemoryStream())
            {
                int msgLength = BitConverter.ToInt32(gzBuffer, 0);
                ms.Write(gzBuffer, 4, gzBuffer.Length - 4);

                byte[] buffer = new byte[msgLength];

                ms.Position = 0;
                using (System.IO.Compression.GZipStream zip = new System.IO.Compression.GZipStream(ms, System.IO.Compression.CompressionMode.Decompress))
                {
                    zip.Read(buffer, 0, buffer.Length);
                }

                return Encoding.Unicode.GetString(buffer, 0, buffer.Length);
            }
        }
    }
}
