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
            Icon = Properties.Resources.AppIcon;
        }

        protected override void WndProc(ref Message m)
        {
            if (m.Msg == NativeMethods.WM_SHOWME)
            {
                Show();
                if (WindowState == FormWindowState.Minimized)
                {
                    WindowState = FormWindowState.Normal;
                }
                Activate();
            }
            base.WndProc(ref m);
        }

        #region MainForm Events

        private void MainForm_Load(object sender, EventArgs e)
        {
        }

        private void MainForm_FormClosed(object sender, FormClosedEventArgs e)
        {

        }

        #endregion

        #region ToolStripClick Events

        private void closeToolStripMenuItem_Click(object sender, EventArgs e)
        {
            Close();
        }

        private void rulesToolStripMenuItem_Click(object sender, EventArgs e)
        {
            Globals.OnOpenRules?.Invoke(sender, e);
        }

        #endregion

        private void showLogsToolStripMenuItem_Click(object sender, EventArgs e)
        {
            Globals.OnOpenLogs?.Invoke(sender, e);
        }

        private void exitToolStripMenuItem_Click(object sender, EventArgs e)
        {
            Globals.OnShutDown?.Invoke(sender, e);
        }

        private void addNovelToolStripMenuItem_Click(object sender, EventArgs e)
        {
            new AddNovelForm().Show();
        }
    }
}
