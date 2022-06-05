using System;
using CefSharp;
using System.Data;
using System.Linq;
using System.Text;
using System.Drawing;
using CefSharp.WinForms;
using System.Windows.Forms;
using System.ComponentModel;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace NovelDownloader_v2
{
    public partial class MainForm : FormWrapper
    {
        public MainForm()
        {
            InitializeComponent();
        }

        private void Form1_Load(object sender, EventArgs e)
        {
        }

        private void Form1_FormClosed(object sender, FormClosedEventArgs e)
        {
        }

        private void Form1_FormClosing(object sender, FormClosingEventArgs e)
        {
            e.Cancel = true;
            CloseMe(sender, e);
        }

        private void closeToolStripMenuItem_Click(object sender, EventArgs e)
        {
            CloseMe(sender, e);
        }
    }
}
