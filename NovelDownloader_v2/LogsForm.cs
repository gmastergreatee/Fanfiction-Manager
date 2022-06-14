using System;
using System.Data;
using System.Linq;
using System.Text;
using System.Drawing;
using System.Windows.Forms;
using System.ComponentModel;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace NovelDownloader_v2
{
    public partial class LogsForm : FormWrapper
    {
        public LogsForm()
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
                    if (!string.IsNullOrWhiteSpace(txtConsole.SelectedText))
                    {
                        Clipboard.SetText(txtConsole.SelectedText);
                    }
                }),
                new MenuItem("Clear", (sender, e) =>
                {
                    txtConsole.Clear();
                }),
            });
        }

        public void AppendText(string text)
        {
            if (!InvokeRequired)
            {
                var now = DateTime.Now.ToString("[yyyy-MM-dd HH:mm:ss] ");
                txtConsole.AppendText(now + text + Environment.NewLine);
                return;
            }

            Invoke(new Action(() =>
            {
                AppendText(text);
            }));
        }

        public void ShowMessageBox(string text)
        {
            if (!InvokeRequired)
            {
                MessageBox.Show(text, "Info", MessageBoxButtons.OK, MessageBoxIcon.Information);
                return;
            }

            Invoke(new Action(() =>
            {
                ShowMessageBox(text);
            }));
        }
    }
}
