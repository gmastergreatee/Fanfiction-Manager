using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace NovelDownloader_v2
{
    public partial class Logs : Form
    {
        #region EventHandlers
        public event EventHandler OnCloseClick;
        #endregion

        public Logs()
        {
            InitializeComponent();
            txtConsole.ContextMenu = new ContextMenu(new MenuItem[]
            {
                new MenuItem("Select All", (sender, e) =>
                {
                    txtConsole.SelectAll();
                }),
                new MenuItem("Copy", (sender, e) =>
                {
                    Clipboard.SetText(txtConsole.SelectedText);
                }),
                new MenuItem("Clear", (sender, e) =>
                {
                    txtConsole.Clear();
                }),
            });
        }

        private void Logs_FormClosing(object sender, FormClosingEventArgs e)
        {
            OnCloseClick?.Invoke(sender, e);
            e.Cancel = true;
            Hide();
        }

        public void AppendText(string text)
        {
            txtConsole.AppendText(text + Environment.NewLine);
        }

        public void ShowLog()
        {
            Show();
        }

        private void Logs_Load(object sender, EventArgs e)
        {
            Hide();
        }
    }
}
